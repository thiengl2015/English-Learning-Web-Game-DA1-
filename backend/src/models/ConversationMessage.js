module.exports = (sequelize, DataTypes) => {
  const ConversationMessage = sequelize.define(
    "ConversationMessage",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "conversations",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      role: {
        type: DataTypes.ENUM("user", "assistant", "system"),
        allowNull: false,
        comment: "Message sender role",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: "Message content",
      },
      tokens_used: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Tokens used for this message",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "conversation_messages",
      timestamps: false,
      indexes: [
        {
          fields: ["conversation_id", "created_at"],
        },
      ],
    }
  );

  ConversationMessage.associate = (models) => {
    ConversationMessage.belongsTo(models.Conversation, {
      foreignKey: "conversation_id",
      as: "conversation",
    });
  };

  return ConversationMessage;
};
