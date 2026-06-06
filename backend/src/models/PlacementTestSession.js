module.exports = (sequelize, DataTypes) => {
  const PlacementTestSession = sequelize.define(
    "PlacementTestSession",
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
      age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 8,
          max: 18,
        },
      },
      level_input: {
        type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
        allowNull: false,
      },
      selected_topics: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Array of 3 topic slugs selected by user",
      },
      questions_data: {
        type: DataTypes.JSON,
        allowNull: false,
        comment: "Full AI-generated questions with correct answers",
      },
      answers_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: "User answers for all sections",
      },
      score: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: "Overall score 0-100",
      },
      section_scores: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: "Per-section scores: { sectionA: {correct,total}, ... }",
      },
      passed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      cefr_level: {
        type: DataTypes.ENUM("A1", "A2", "B1", "B2", "C1"),
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.ENUM("in-progress", "completed", "abandoned"),
        defaultValue: "in-progress",
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "completed_at",
      },
    },
    {
      tableName: "placement_test_sessions",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  PlacementTestSession.associate = (models) => {
    PlacementTestSession.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return PlacementTestSession;
};
