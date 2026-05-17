module.exports = (sequelize, DataTypes) => {
  const GameSession = sequelize.define(
    "GameSession",
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
      game_config_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "game_config",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      status: {
        type: DataTypes.ENUM("in-progress", "completed", "abandoned"),
        defaultValue: "in-progress",
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Điểm số (0-100)",
      },
      correct_answers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_questions: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      questions_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "JSON chứa câu hỏi và đáp án",
      },
      time_spent: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Thời gian chơi (seconds)",
      },
      xp_earned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
    },
    {
      tableName: "game_sessions",
      timestamps: false,
      indexes: [
        {
          fields: ["user_id"],
        },
        {
          fields: ["game_config_id"],
        },
        {
          fields: ["created_at"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  GameSession.associate = (models) => {
    GameSession.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    GameSession.belongsTo(models.GameConfig, {
      foreignKey: "game_config_id",
      as: "config",
    });

    GameSession.hasMany(models.GameWrongAnswer, {
      foreignKey: "game_session_id",
      as: "wrongAnswers",
    });
  };

  return GameSession;
};
