module.exports = (sequelize, DataTypes) => {
  const Lesson = sequelize.define(
    "Lesson",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "units",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("vocabulary", "practice", "test"),
        allowNull: false,
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      position_x: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      position_y: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "lessons",
      timestamps: false,
    }
  );

  Lesson.associate = (models) => {
    Lesson.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });
    Lesson.hasMany(models.UserLessonProgress, {
      foreignKey: "lesson_id",
      as: "userProgress",
    });
    Lesson.belongsToMany(models.Vocabulary, {
      through: models.LessonVocabulary,
      foreignKey: "lesson_id",
      otherKey: "vocab_id",
      as: "vocabulary",
    });
    Lesson.hasMany(models.Question, {
      foreignKey: "lesson_id",
      as: "questions",
    });
    Lesson.hasMany(models.GameConfig, {
      foreignKey: "lesson_id",
      as: "gameConfigs",
    });
  };

  return Lesson;
};
