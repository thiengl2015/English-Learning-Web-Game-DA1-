module.exports = (sequelize, DataTypes) => {
  const PracticeTopic = sequelize.define(
    "PracticeTopic",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      mode: {
        type: DataTypes.ENUM("listen-fill", "listen-repeat", "read-answer", "read-story"),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      emoji: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
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
      tableName: "practice_topics",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["mode", "slug"],
        },
      ],
      hooks: {
        beforeUpdate: (topic) => {
          topic.updated_at = new Date();
        },
      },
    }
  );

  PracticeTopic.associate = (models) => {
    PracticeTopic.hasMany(models.PracticeItem, {
      foreignKey: "topic_id",
      as: "items",
      onDelete: "CASCADE",
    });
    PracticeTopic.hasMany(models.PracticeAttempt, {
      foreignKey: "topic_id",
      as: "attempts",
      onDelete: "CASCADE",
    });
    PracticeTopic.hasMany(models.PracticeProgress, {
      foreignKey: "topic_id",
      as: "progressRows",
      onDelete: "CASCADE",
    });
  };

  return PracticeTopic;
};
