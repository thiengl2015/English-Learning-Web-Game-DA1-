module.exports = (sequelize, DataTypes) => {
  const DirectMessage = sequelize.define(
    "DirectMessage",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      receiver_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.ENUM("text", "image", "voice"),
        defaultValue: "text",
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      media_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      voice_duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "direct_messages",
      timestamps: false,
      indexes: [
        {
          fields: ["sender_id", "receiver_id", "created_at"],
        },
        {
          fields: ["receiver_id", "read_at"],
        },
      ],
    }
  );

  DirectMessage.associate = (models) => {
    DirectMessage.belongsTo(models.User, {
      foreignKey: "sender_id",
      as: "sender",
    });
    DirectMessage.belongsTo(models.User, {
      foreignKey: "receiver_id",
      as: "receiver",
    });
  };

  return DirectMessage;
};
