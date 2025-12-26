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

    // Update conversation
    await conversation.update({
      total_messages: conversation.total_messages + 2,
    });

    return {
      user_message: userMessage,
      ai_response: aiResponse.content,
      tokens_used: aiResponse.tokens_used,
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
}

module.exports = new AIService();
