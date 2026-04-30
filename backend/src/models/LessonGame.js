module.exports = (sequelize, DataTypes) => {
  const LessonGame = sequelize.define(
    "LessonGame",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "lessons",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      game_type: {
        type: DataTypes.ENUM("signal-check", "galaxy-match", "planetary-order", "rescue-mission"),
        allowNull: false,
      },
      difficulty: {
        type: DataTypes.ENUM("easy", "medium", "hard"),
        defaultValue: "medium",
      },
      question_count: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
    },
    {
      tableName: "lesson_games",
      timestamps: false,
      indexes: [
        {
          fields: ["lesson_id"],
        },
      ],
    }
  );

  LessonGame.associate = (models) => {
    LessonGame.belongsTo(models.Lesson, {
      foreignKey: "lesson_id",
      as: "lesson",
    });

    LessonGame.hasMany(models.GameSession, {
      foreignKey: "lesson_game_id",
      as: "sessions",
    });
  };

  return LessonGame;
};
