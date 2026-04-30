module.exports = (sequelize, DataTypes) => {
  const GameWrongAnswer = sequelize.define(
    "GameWrongAnswer",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      game_session_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "game_sessions",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      question_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      prompt: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Câu hỏi",
      },
      user_answer: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: "Đáp án user chọn",
      },
      correct_answer: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Đáp án đúng",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "game_wrong_answers",
      timestamps: false,
      indexes: [
        {
          fields: ["game_session_id"],
        },
        {
          fields: ["question_id"],
        },
      ],
    }
  );

  GameWrongAnswer.associate = (models) => {
    GameWrongAnswer.belongsTo(models.GameSession, {
      foreignKey: "game_session_id",
      as: "session",
    });
  };

  return GameWrongAnswer;
};
