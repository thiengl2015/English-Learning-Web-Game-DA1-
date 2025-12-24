module.exports = (sequelize, DataTypes) => {
  const Vocabulary = sequelize.define(
    "Vocabulary",
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
        onDelete: "CASCADE",
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
      word: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phonetic: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      translation: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      audio_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
      tableName: "vocabulary",
      timestamps: false,
      hooks: {
        beforeUpdate: (vocabulary) => {
          vocabulary.updated_at = new Date();
        },
      },
    }
  );

  Vocabulary.associate = (models) => {
    Vocabulary.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });
    Vocabulary.belongsTo(models.Lesson, {
      foreignKey: "lesson_id",
      as: "lesson",
    });
    Vocabulary.hasMany(models.UserVocabulary, {
      foreignKey: "vocab_id",
      as: "userProgress",
      onDelete: "CASCADE",
    });
    Vocabulary.hasMany(models.GameWrongAnswer, {
      foreignKey: "vocab_id",
      as: "wrongAnswers",
      onDelete: "CASCADE",
    });
  };

  return Vocabulary;
};
