module.exports = (sequelize, DataTypes) => {
  const GameWrongAnswer = sequelize.define(
    "GameWrongAnswer",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      session_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "game_sessions",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      vocab_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "vocabulary",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
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
          fields: ["session_id"],
        },
        {
          fields: ["vocab_id"],
        },
      ],
    }
  );

  GameWrongAnswer.associate = (models) => {
    GameWrongAnswer.belongsTo(models.GameSession, {
      foreignKey: "session_id",
      as: "session",
    });

    GameWrongAnswer.belongsTo(models.Vocabulary, {
      foreignKey: "vocab_id",
      as: "vocabulary",
    });
  };

  return GameWrongAnswer;
};
