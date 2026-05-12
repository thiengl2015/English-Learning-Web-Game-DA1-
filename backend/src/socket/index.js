const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt.util");
const { User } = require("../models");
const aiService = require("../services/ai.service");

class SocketServer {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.connectedUsers = new Map();

    this.setupMiddleware();
    this.setupHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                      socket.handshake.headers.authorization?.replace("Bearer ", "") ||
                      socket.handshake.query.token;

        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = verifyToken(token);
        const user = await User.findByPk(decoded.id, {
          attributes: ["id", "username", "display_name", "avatar", "status", "role"],
        });

        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        if (user.status !== "Active") {
          return next(new Error("Authentication error: Account is not active"));
        }

        socket.user = user;
        next();
      } catch (error) {
        console.error("Socket auth error:", error.message);
        next(new Error("Authentication error: " + error.message));
      }
    });
  }

  setupHandlers() {
    this.io.on("connection", (socket) => {
      console.log(`[Socket.IO] User connected: ${socket.user.username} (${socket.id})`);

      this.connectedUsers.set(socket.user.id, {
        socketId: socket.id,
        username: socket.user.username,
        connectedAt: new Date(),
      });

      this.handleJoinConversation(socket);
      this.handleSendMessage(socket);
      this.handleTyping(socket);
      this.handleEndConversation(socket);
      this.handleDisconnect(socket);
    });
  }

  handleJoinConversation(socket) {
    socket.on("conversation:join", async (data, callback) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          return callback?.({ success: false, error: "Conversation ID is required" });
        }

        const conversation = await require("../models").Conversation.findOne({
          where: {
            id: conversationId,
            user_id: socket.user.id,
          },
        });

        if (!conversation) {
          return callback?.({ success: false, error: "Conversation not found" });
        }

        socket.join(`conversation:${conversationId}`);
        socket.conversationId = conversationId;

        const history = await aiService.getConversationHistory(conversationId, socket.user.id);

        callback?.({ 
          success: true, 
          conversation: {
            id: conversation.id,
            topic: conversation.topic,
            topic_title: conversation.topic_title,
            status: conversation.status,
          },
          history: history.messages,
        });

        socket.to(`conversation:${conversationId}`).emit("conversation:user_joined", {
          userId: socket.user.id,
          username: socket.user.username,
        });

      } catch (error) {
        console.error("[Socket.IO] Join conversation error:", error);
        callback?.({ success: false, error: error.message });
      }
    });
  }

  handleSendMessage(socket) {
    socket.on("conversation:message", async (data, callback) => {
      try {
        const { conversationId, content } = data;

        if (!conversationId || !content) {
          return callback?.({ success: false, error: "Conversation ID and content are required" });
        }

        if (content.trim().length === 0) {
          return callback?.({ success: false, error: "Message cannot be empty" });
        }

        if (content.length > 2000) {
          return callback?.({ success: false, error: "Message is too long (max 2000 characters)" });
        }

        const conversation = await require("../models").Conversation.findOne({
          where: {
            id: conversationId,
            user_id: socket.user.id,
            status: "active",
          },
        });

        if (!conversation) {
          return callback?.({ success: false, error: "Active conversation not found" });
        }

        const tempMessageId = `temp_${Date.now()}_${socket.id}`;
        
        socket.to(`conversation:${conversationId}`).emit("conversation:message", {
          id: tempMessageId,
          conversationId,
          role: "user",
          content: content.trim(),
          created_at: new Date().toISOString(),
          sender: {
            id: socket.user.id,
            username: socket.user.username,
            display_name: socket.user.display_name,
            avatar: socket.user.avatar,
          },
          status: "sending",
        });

        callback?.({ 
          success: true, 
          tempMessageId,
          status: "processing",
        });

        const result = await aiService.sendMessage(conversationId, socket.user.id, content.trim());

        const aiMessage = {
          id: `ai_${Date.now()}`,
          conversationId,
          role: "assistant",
          content: result.ai_response,
          created_at: new Date().toISOString(),
          sender: {
            id: "ai_assistant",
            username: "AI Tutor",
            display_name: "AI Tutor",
            avatar: null,
          },
          status: "delivered",
        };

        socket.emit("conversation:message", aiMessage);
        socket.to(`conversation:${conversationId}`).emit("conversation:message", aiMessage);

        socket.to(`conversation:${conversationId}`).emit("conversation:message_delivered", {
          tempMessageId,
          messageId: aiMessage.id,
        });

        socket.to(`conversation:${conversationId}`).emit("conversation:typing_stop", {
          userId: socket.user.id,
        });

      } catch (error) {
        console.error("[Socket.IO] Send message error:", error);
        socket.emit("conversation:error", {
          conversationId: data.conversationId,
          error: error.message,
        });
        callback?.({ success: false, error: error.message });
      }
    });
  }

  handleTyping(socket) {
    socket.on("conversation:typing_start", (data) => {
      const { conversationId } = data;
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit("conversation:typing_start", {
          userId: socket.user.id,
          username: socket.user.username,
        });
      }
    });

    socket.on("conversation:typing_stop", (data) => {
      const { conversationId } = data;
      if (conversationId) {
        socket.to(`conversation:${conversationId}`).emit("conversation:typing_stop", {
          userId: socket.user.id,
        });
      }
    });
  }

  handleEndConversation(socket) {
    socket.on("conversation:end", async (data, callback) => {
      try {
        const { conversationId, durationSeconds } = data;

        if (!conversationId) {
          return callback?.({ success: false, error: "Conversation ID is required" });
        }

        const result = await aiService.endConversation(conversationId, socket.user.id, durationSeconds || 0);

        this.io.to(`conversation:${conversationId}`).emit("conversation:ended", {
          conversationId,
          userId: socket.user.id,
          ...result,
        });

        socket.leave(`conversation:${conversationId}`);
        socket.conversationId = null;

        callback?.({ success: true, ...result });

      } catch (error) {
        console.error("[Socket.IO] End conversation error:", error);
        callback?.({ success: false, error: error.message });
      }
    });
  }

  handleDisconnect(socket) {
    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] User disconnected: ${socket.user.username} (${socket.id}) - Reason: ${reason}`);

      this.connectedUsers.delete(socket.user.id);

      if (socket.conversationId) {
        socket.to(`conversation:${socket.conversationId}`).emit("conversation:user_left", {
          userId: socket.user.id,
          username: socket.user.username,
        });
      }
    });
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.values());
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = SocketServer;
