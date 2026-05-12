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
      lesson_game_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "lesson_games",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Điểm số (0-100)",
      },
      correct_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
          fields: ["lesson_game_id"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  );

  GameSession.associate = (models) => {
    GameSession.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });

    GameSession.belongsTo(models.LessonGame, {
      foreignKey: "lesson_game_id",
      as: "lessonGame",
    });

    GameSession.hasMany(models.GameWrongAnswer, {
      foreignKey: "session_id",
      as: "wrongAnswers",
    });
  };

  return GameSession;
};
