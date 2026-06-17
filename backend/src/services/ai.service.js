const {
  Conversation,
  ConversationMessage,
  User,
  UserProgress,
  UserVocabulary,
  LessonProgress,
} = require("../models");
const openaiService = require("./openai.service");
const { Op } = require("sequelize");

class AIService {
  getFallbackConversationTitle(userMessage) {
    const cleaned = String(userMessage || "")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) {
      return "New Chat";
    }

    return cleaned.length > 48 ? `${cleaned.slice(0, 45)}...` : cleaned;
  }

  async generateConversationTitle(userMessage, aiResponse) {
    const fallbackTitle = this.getFallbackConversationTitle(userMessage);

    try {
      const titleResponse = await openaiService.chat(
        [
          {
            role: "user",
            content: `User message: ${userMessage}\nAssistant response: ${aiResponse}\n\nCreate a concise chat title in 2-6 words. Return only the title, no quotes.`,
          },
        ],
        {
          system_prompt:
            "You create short, natural conversation titles for an English learning assistant.",
          max_tokens: 20,
          temperature: 0.2,
        }
      );

      const title = String(titleResponse.content || "")
        .replace(/^["']|["']$/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (!title) {
        return fallbackTitle;
      }

      return title.length > 80 ? title.slice(0, 80).trim() : title;
    } catch (error) {
      console.warn("Failed to generate conversation title:", error.message);
      return fallbackTitle;
    }
  }

  isDefaultTopicTitle(topicId, title) {
    const topic = this.getTopics().find((item) => item.id === topicId);
    return !title || (topic && title === topic.title);
  }

  getTopics() {
    return [
      {
        id: "daily-life",
        title: "Daily Life",
        title_vi: "Cuộc sống hàng ngày",
        description: "Practice everyday conversations",
        description_vi: "Luyện tập hội thoại hàng ngày",
        icon: "🏠",
        difficulty: "beginner",
      },
      {
        id: "travel",
        title: "Travel & Tourism",
        title_vi: "Du lịch",
        description: "Learn travel vocabulary and phrases",
        description_vi: "Học từ vựng và cụm từ du lịch",
        icon: "✈️",
        difficulty: "beginner",
      },
      {
        id: "food",
        title: "Food & Restaurants",
        title_vi: "Đồ ăn & Nhà hàng",
        description: "Talk about food, cooking, and dining",
        description_vi: "Nói về đồ ăn, nấu ăn và ăn uống",
        icon: "🍕",
        difficulty: "beginner",
      },
      {
        id: "work",
        title: "Work & Career",
        title_vi: "Công việc & Sự nghiệp",
        description: "Practice professional English",
        description_vi: "Luyện tập tiếng Anh chuyên nghiệp",
        icon: "💼",
        difficulty: "intermediate",
      },
      {
        id: "hobbies",
        title: "Hobbies & Interests",
        title_vi: "Sở thích",
        description: "Discuss your favorite activities",
        description_vi: "Thảo luận về các hoạt động yêu thích",
        icon: "🎮",
        difficulty: "intermediate",
      },
      {
        id: "general",
        title: "General Conversation",
        title_vi: "Hội thoại tổng quát",
        description: "Free conversation on any topic",
        description_vi: "Trò chuyện tự do về bất kỳ chủ đề nào",
        icon: "💬",
        difficulty: "all",
      },
    ];
  }

  async startConversation(userId, topicId) {
    // Validate topic
    const topics = this.getTopics();
    const topic = topics.find((t) => t.id === topicId);

    if (!topic) {
      throw new Error("Invalid topic");
    }

    // Create conversation
    const conversation = await Conversation.create({
      user_id: userId,
      topic: topicId,
      topic_title: topic.title,
      status: "active",
    });

    // Generate greeting message
    const systemPrompt = openaiService.getSystemPrompt(topicId);

    const greetingMessages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: "Hello! I want to practice English conversation.",
      },
    ];

    const aiResponse = await openaiService.chat(greetingMessages);

    // Save greeting message
    await ConversationMessage.create({
      conversation_id: conversation.id,
      role: "assistant",
      content: aiResponse.content,
      tokens_used: aiResponse.tokens_used,
    });

    await conversation.update({
      total_messages: 1,
    });

    return {
      conversation_id: conversation.id,
      topic: topic,
      greeting: aiResponse.content,
      started_at: conversation.started_at,
    };
  }

  async sendMessage(conversationId, userId, userMessage) {
    // Get conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        user_id: userId,
        status: "active",
      },
      include: [
        {
          model: ConversationMessage,
          as: "messages",
          separate: true,
          order: [["created_at", "ASC"]],
          limit: 20, // Keep last 20 messages for context
        },
      ],
    });

    if (!conversation) {
      throw new Error("Conversation not found or not active");
    }

    // Save user message
    await ConversationMessage.create({
      conversation_id: conversationId,
      role: "user",
      content: userMessage,
    });

    // Build conversation history for OpenAI
    const messages = conversation.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    // Get AI response
    const systemPrompt = openaiService.getSystemPrompt(conversation.topic);
    const aiResponse = await openaiService.chat(messages, {
      system_prompt: systemPrompt,
    });

    // Save AI response
    await ConversationMessage.create({
      conversation_id: conversationId,
      role: "assistant",
      content: aiResponse.content,
      tokens_used: aiResponse.tokens_used,
    });

    const updates = {
      total_messages: conversation.total_messages + 2,
    };

    if (
      conversation.total_messages <= 1 &&
      this.isDefaultTopicTitle(conversation.topic, conversation.topic_title)
    ) {
      updates.topic_title = await this.generateConversationTitle(
        userMessage,
        aiResponse.content
      );
    }

    // Update conversation
    await conversation.update(updates);

    return {
      user_message: userMessage,
      ai_response: aiResponse.content,
      tokens_used: aiResponse.tokens_used,
      conversation_title: updates.topic_title || conversation.topic_title,
    };
  }

  async getConversationHistory(conversationId, userId) {
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        user_id: userId,
      },
      include: [
        {
          model: ConversationMessage,
          as: "messages",
          separate: true,
          order: [["created_at", "ASC"]],
        },
      ],
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return {
      conversation_id: conversation.id,
      topic: conversation.topic,
      topic_title: conversation.topic_title,
      status: conversation.status,
      total_messages: conversation.total_messages,
      started_at: conversation.started_at,
      ended_at: conversation.ended_at,
      messages: conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at,
      })),
    };
  }

  async endConversation(conversationId, userId, durationSeconds = 0) {
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        user_id: userId,
        status: "active",
      },
    });

    if (!conversation) {
      throw new Error("Active conversation not found");
    }

    await conversation.update({
      status: "completed",
      duration_seconds: durationSeconds,
      ended_at: new Date(),
    });

    return {
      message: "Conversation ended",
      total_messages: conversation.total_messages,
      duration_seconds: durationSeconds,
    };
  }

  async getUserConversations(userId, filters = {}) {
    const { status, limit = 20, page = 1 } = filters;

    const where = { user_id: userId };
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Conversation.findAndCountAll({
      where,
      include: [
        {
          model: ConversationMessage,
          as: "messages",
          separate: true,
          limit: 1,
          order: [["created_at", "DESC"]],
          attributes: ["created_at"],
        },
      ],
      order: [["started_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      conversations: rows.map((conv) => ({
        conversation_id: conv.id,
        topic: conv.topic,
        topic_title: conv.topic_title,
        status: conv.status,
        total_messages: conv.total_messages,
        duration_seconds: conv.duration_seconds,
        started_at: conv.started_at,
        ended_at: conv.ended_at,
        updated_at:
          conv.messages?.[0]?.created_at || conv.ended_at || conv.started_at,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getRecommendations(userId) {
    // Get user progress
    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserProgress,
          as: "progress",
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get learning statistics
    const lessonsCompleted = await LessonProgress.count({
      where: {
        user_id: userId,
        status: "completed",
      },
    });

    const vocabularyLearned = await UserVocabulary.count({
      where: {
        user_id: userId,
      },
    });

    const weakVocabulary = await UserVocabulary.findAll({
      where: {
        user_id: userId,
        mastery_level: { [Op.lt]: 3 },
        incorrect_count: { [Op.gt]: 0 },
      },
      limit: 5,
      order: [["mastery_level", "ASC"]],
    });

    // Build prompt for recommendations
    const prompt = `Based on this English learner's progress:
    - Level: ${user.current_level || "beginner"}
    - Learning goal: ${user.learning_goal || "general"}
    - Lessons completed: ${lessonsCompleted}
    - Words learned: ${vocabularyLearned}
    - Total XP: ${user.progress?.total_xp || 0}
    - Weak areas: ${
      weakVocabulary.length > 0 ? "vocabulary mastery" : "none identified"
    }
    
    Provide 3-5 personalized learning recommendations in Vietnamese.
    Format as JSON array with objects containing: { title, description, priority }
    Priority should be: high, medium, or low`;

    try {
      const result = await openaiService.generateJSON(prompt);
      return result.data;
    } catch (error) {
      // Fallback to default recommendations
      console.error("Failed to generate AI recommendations:", error);
      return this.getDefaultRecommendations(user);
    }
  }

  getDefaultRecommendations(user) {
    const recommendations = [
      {
        title: "Luyện tập hàng ngày",
        description: "Hoàn thành ít nhất 1 lesson mỗi ngày để duy trì streak",
        priority: "high",
      },
      {
        title: "Ôn tập từ vựng yếu",
        description:
          "Review lại các từ vựng bạn thường nhầm để cải thiện độ thuần thục",
        priority: "high",
      },
      {
        title: "Chơi game Galaxy Match",
        description: "Luyện tập ghép từ vựng một cách vui vẻ và hiệu quả",
        priority: "medium",
      },
    ];

    return recommendations;
  }
  async generatePracticeQuestions(userId, options = {}) {
    const {
      lesson_id,
      vocab_ids,
      question_count = 5,
      difficulty = "medium",
    } = options;

    // Get vocabulary
    let vocabulary = [];

    if (vocab_ids && vocab_ids.length > 0) {
      // Use specific vocab IDs
      vocabulary = await require("../models").Vocabulary.findAll({
        where: { id: { [Op.in]: vocab_ids } },
        limit: 20,
      });
    } else if (lesson_id) {
      // Use lesson vocabulary
      vocabulary = await require("../models").Vocabulary.findAll({
        where: { lesson_id },
        limit: 20,
      });
    } else {
      // Use user's weak vocabulary
      const weakVocab = await require("../models").UserVocabulary.findAll({
        where: {
          user_id: userId,
          mastery_level: { [Op.lt]: 3 },
        },
        include: [
          {
            model: require("../models").Vocabulary,
            as: "vocabulary",
          },
        ],
        limit: 20,
        order: [["mastery_level", "ASC"]],
      });

      vocabulary = weakVocab.map((uv) => uv.vocabulary);
    }

    if (vocabulary.length < 3) {
      throw new Error("Not enough vocabulary to generate questions");
    }

    // Build prompt
    const vocabList = vocabulary
      .map((v) => `- ${v.word} (${v.phonetic || ""}): ${v.translation}`)
      .join("\n");

    const prompt = `Create ${question_count} English practice questions using these vocabulary words:

${vocabList}

Requirements:
- Difficulty: ${difficulty}
- Question types: multiple choice, fill in blank, or sentence building
- Include Vietnamese translations
- Each question must use at least one word from the list
- Provide 4 options for multiple choice (A, B, C, D)
- Mark the correct answer

Format as JSON array with structure:
[
  {
    "type": "multiple-choice" | "fill-blank" | "sentence-building",
    "question": "English question",
    "question_vi": "Vietnamese translation",
    "vocab_word": "main vocabulary word used",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."], // for multiple choice
    "correct_answer": "correct answer text",
    "explanation": "brief explanation in Vietnamese"
  }
]`;

    try {
      const result = await openaiService.generateJSON(prompt, {
        max_tokens: 1500,
        temperature: 0.8,
      });

      return {
        questions: result.data,
        vocabulary_used: vocabulary.map((v) => ({
          id: v.id,
          word: v.word,
          translation: v.translation,
        })),
        tokens_used: result.tokens_used,
      };
    } catch (error) {
      console.error("Failed to generate practice questions:", error);
      throw new Error("Failed to generate practice questions");
    }
  }

  /**
   * Generate explanation for vocabulary
   */
  async generateExplanation(vocabId, type = "usage") {
    // Get vocabulary
    const vocab = await require("../models").Vocabulary.findByPk(vocabId);

    if (!vocab) {
      throw new Error("Vocabulary not found");
    }

    // Build prompt based on type
    let prompt = "";

    switch (type) {
      case "usage":
        prompt = `Explain how to use the English word "${vocab.word}" (${vocab.translation}) in Vietnamese.
      
Include:
1. Common situations to use this word
2. 3-4 example sentences with Vietnamese translations
3. Common collocations or phrases
4. Pronunciation tips if needed

Keep it simple and practical for Vietnamese learners.`;
        break;

      case "grammar":
        prompt = `Explain the grammar rules for using "${vocab.word}" (${vocab.translation}) in Vietnamese.
      
Include:
1. Part of speech
2. How it changes in different tenses (if verb)
3. Common grammar patterns
4. 2-3 example sentences

Use simple Vietnamese explanations.`;
        break;

      case "examples":
        prompt = `Provide 5-7 diverse example sentences using "${vocab.word}" (${vocab.translation}).

For each sentence:
- English sentence
- Vietnamese translation
- Brief context note

Make examples practical and varied in difficulty.`;
        break;

      case "comparison":
        prompt = `Compare "${vocab.word}" (${vocab.translation}) with similar English words in Vietnamese.

Include:
1. Similar words and their differences
2. When to use each word
3. Example sentences showing the differences
4. Common mistakes Vietnamese learners make

Format as clear, structured explanation.`;
        break;

      default:
        prompt = `Provide a comprehensive explanation of "${vocab.word}" (${vocab.translation}) in Vietnamese, suitable for English learners.`;
    }

    try {
      const response = await openaiService.chat(
        [{ role: "user", content: prompt }],
        {
          max_tokens: 800,
          temperature: 0.7,
        }
      );

      return {
        vocab_id: vocabId,
        word: vocab.word,
        translation: vocab.translation,
        type: type,
        explanation: response.content,
        tokens_used: response.tokens_used,
      };
    } catch (error) {
      console.error("Failed to generate explanation:", error);
      throw new Error("Failed to generate explanation");
    }
  }

  /**
   * Generate content ideas for lessons
   */
  async generateContentIdeas(topic, level = "beginner") {
    const prompt = `Suggest 5 engaging learning activities for teaching English topic "${topic}" to ${level} level Vietnamese students.

For each activity:
1. Activity name
2. Description (in Vietnamese)
3. Estimated time
4. Materials needed
5. Learning objectives

Format as JSON array.`;

    try {
      const result = await openaiService.generateJSON(prompt, {
        max_tokens: 1000,
        temperature: 0.8,
      });

      return result.data;
    } catch (error) {
      console.error("Failed to generate content ideas:", error);
      throw new Error("Failed to generate content ideas");
    }
  }

  /**
   * Analyze user's learning patterns
   */
  async analyzeUserProgress(userId) {
    // Get comprehensive user data
    const [lessonsData, vocabData, gamesData] = await Promise.all([
      require("../models").LessonProgress.findAll({
        where: { user_id: userId },
        order: [["completed_at", "DESC"]],
        limit: 20,
      }),
      require("../models").UserVocabulary.findAll({
        where: { user_id: userId },
        order: [["last_reviewed", "DESC"]],
        limit: 50,
      }),
      require("../models").GameSession.findAll({
        where: {
          user_id: userId,
          status: "completed",
        },
        order: [["completed_at", "DESC"]],
        limit: 10,
      }),
    ]);

    const analysisData = {
      lessons_completed: lessonsData.length,
      average_lesson_score:
        lessonsData.length > 0
          ? lessonsData.reduce((sum, l) => sum + (l.score || 0), 0) /
            lessonsData.length
          : 0,
      vocabulary_learned: vocabData.length,
      average_mastery:
        vocabData.length > 0
          ? vocabData.reduce((sum, v) => sum + v.mastery_level, 0) /
            vocabData.length
          : 0,
      games_played: gamesData.length,
      average_game_score:
        gamesData.length > 0
          ? gamesData.reduce((sum, g) => sum + g.score, 0) / gamesData.length
          : 0,
      weak_areas: vocabData
        .filter((v) => v.mastery_level < 3)
        .slice(0, 5)
        .map((v) => v.vocab_id),
    };

    const prompt = `Analyze this English learner's progress and provide insights in Vietnamese:

Statistics:
- Lessons completed: ${analysisData.lessons_completed}
- Average lesson score: ${analysisData.average_lesson_score.toFixed(1)}%
- Vocabulary learned: ${analysisData.vocabulary_learned}
- Average vocabulary mastery: ${analysisData.average_mastery.toFixed(1)}/5
- Games played: ${analysisData.games_played}
- Average game score: ${analysisData.average_game_score.toFixed(1)}%

Provide:
1. Overall assessment (1 paragraph)
2. Strengths (2-3 points)
3. Areas for improvement (2-3 points)
4. Specific action items (3-4 items)

Format as JSON with keys: assessment, strengths, improvements, action_items`;

    try {
      const result = await openaiService.generateJSON(prompt, {
        max_tokens: 800,
        temperature: 0.7,
      });

      return {
        ...result.data,
        statistics: analysisData,
        tokens_used: result.tokens_used,
      };
    } catch (error) {
      console.error("Failed to analyze progress:", error);
      // Return basic analysis
      return {
        assessment: "Đang phân tích dữ liệu học tập của bạn...",
        strengths: ["Kiên trì học tập hàng ngày"],
        improvements: ["Tăng cường luyện tập từ vựng"],
        action_items: ["Hoàn thành ít nhất 1 bài học mỗi ngày"],
        statistics: analysisData,
      };
    }
  }
}

module.exports = new AIService();
