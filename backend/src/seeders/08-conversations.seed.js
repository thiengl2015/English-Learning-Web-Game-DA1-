const { Conversation, ConversationMessage, User } = require("../models");

const seedConversations = async () => {
  try {
    console.log("📦 Seeding conversations...");

    await ConversationMessage.destroy({ where: {}, force: true });
    await Conversation.destroy({ where: {}, force: true });

    const users = await User.findAll({ limit: 2 });

    if (users.length === 0) {
      console.log("⚠️  Users not found. Please seed users first.");
      return;
    }

    const conversationData = [
      {
        user_id: users[0].id,
        topic: "greeting",
        topic_title: "Practicing Greetings",
        status: "completed",
        total_messages: 6,
        duration_seconds: 180,
        started_at: new Date(Date.now() - 3600000),
        ended_at: new Date(Date.now() - 3420000),
      },
      {
        user_id: users[0].id,
        topic: "shopping",
        topic_title: "At the Store",
        status: "active",
        total_messages: 4,
        duration_seconds: 120,
        started_at: new Date(Date.now() - 600000),
      },
      {
        user_id: users[1]?.id || users[0].id,
        topic: "travel",
        topic_title: "Planning a Trip",
        status: "completed",
        total_messages: 8,
        duration_seconds: 300,
        started_at: new Date(Date.now() - 86400000),
        ended_at: new Date(Date.now() - 86100000),
      },
    ];

    const conversations = await Conversation.bulkCreate(conversationData);

    // Create messages for each conversation
    const messagesData = [];
    for (const conv of conversations) {
      const isCompleted = conv.status === "completed";

      messagesData.push(
        {
          conversation_id: conv.id,
          role: "system",
          content: `You are practicing ${conv.topic_title.toLowerCase()}. Respond naturally.`,
          tokens_used: 15,
          created_at: conv.started_at,
        },
        {
          conversation_id: conv.id,
          role: "user",
          content: `Hello! I want to practice ${conv.topic}.`,
          tokens_used: 25,
          created_at: new Date(conv.started_at.getTime() + 1000),
        },
        {
          conversation_id: conv.id,
          role: "assistant",
          content: `Great! Let's practice together. I'm excited to help you with ${conv.topic}. What's your level in English?`,
          tokens_used: 45,
          created_at: new Date(conv.started_at.getTime() + 2000),
        },
        {
          conversation_id: conv.id,
          role: "user",
          content: "I'm a beginner. Can you help me with basic sentences?",
          tokens_used: 30,
          created_at: new Date(conv.started_at.getTime() + 3000),
        }
      );

      if (isCompleted) {
        messagesData.push(
          {
            conversation_id: conv.id,
            role: "assistant",
            content: "Of course! Let's start with: 'Hello, how are you?' Try to respond.",
            tokens_used: 40,
            created_at: new Date(conv.started_at.getTime() + 4000),
          },
          {
            conversation_id: conv.id,
            role: "user",
            content: "I'm fine, thank you. And you?",
            tokens_used: 35,
            created_at: new Date(conv.started_at.getTime() + 5000),
          },
          {
            conversation_id: conv.id,
            role: "assistant",
            content: "Excellent! That's perfect. Keep practicing!",
            tokens_used: 25,
            created_at: new Date(conv.started_at.getTime() + 6000),
          }
        );
      }
    }

    await ConversationMessage.bulkCreate(messagesData);

    console.log(`✅ Successfully seeded ${conversations.length} conversations with messages!`);
    return conversations;
  } catch (error) {
    console.error("❌ Error seeding conversations:", error);
    throw error;
  }
};

module.exports = seedConversations;
