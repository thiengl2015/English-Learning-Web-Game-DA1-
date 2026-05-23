module.exports = (sequelize, DataTypes) => {
  const PracticeAttempt = sequelize.define(
    "PracticeAttempt",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
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
      mode: {
        type: DataTypes.ENUM("listen-fill", "listen-repeat", "read-answer", "read-story"),
        allowNull: false,
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      correct_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      time_spent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Seconds spent in this practice attempt",
      },
      xp_earned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("in-progress", "completed", "abandoned"),
        defaultValue: "in-progress",
      },
      answers: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      completed_at: {
        type: DataTypes.DATE,
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
      tableName: "practice_attempts",
      timestamps: false,
      hooks: {
        beforeUpdate: (attempt) => {
          attempt.updated_at = new Date();
        },
      },
    }
  );

  PracticeAttempt.associate = (models) => {
    PracticeAttempt.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    PracticeAttempt.belongsTo(models.PracticeTopic, {
      foreignKey: "topic_id",
      as: "topic",
    });
  };

  return PracticeAttempt;
};
