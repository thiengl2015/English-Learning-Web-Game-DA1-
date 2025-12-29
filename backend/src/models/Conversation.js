module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        collate: "utf8mb4_unicode_ci",
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      topic: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: "Conversation topic/category",
      },
      topic_title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Human-readable topic title",
      },
      status: {
        type: DataTypes.ENUM("active", "completed", "abandoned"),
        defaultValue: "active",
      },
      total_messages: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Total messages in conversation",
      },
      duration_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Total conversation time",
      },
      started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      ended_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "conversations",
      timestamps: false,
      indexes: [
        {
          fields: ["user_id", "status"],
        },
        {
          fields: ["topic"],
        },
      ],
    }
  );

  Conversation.associate = (models) => {
    Conversation.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    Conversation.hasMany(models.ConversationMessage, {
      foreignKey: "conversation_id",
      as: "messages",
      onDelete: "CASCADE",
    });
  };

  return Conversation;
};
