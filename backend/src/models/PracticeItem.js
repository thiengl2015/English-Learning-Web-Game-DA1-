module.exports = (sequelize, DataTypes) => {
  const PracticeItem = sequelize.define(
    "PracticeItem",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      topic_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "practice_topics",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      prompt: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      passage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      audio_text: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      translation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      content_data: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "practice_items",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["topic_id", "order_index"],
        },
      ],
      hooks: {
        beforeUpdate: (item) => {
          item.updated_at = new Date();
        },
      },
    }
  );

  PracticeItem.associate = (models) => {
    PracticeItem.belongsTo(models.PracticeTopic, {
      foreignKey: "topic_id",
      as: "topic",
    });
  };

  return PracticeItem;
};
