module.exports = (sequelize, DataTypes) => {
  const LessonProgress = sequelize.define(
    "LessonProgress",
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
      status: {
        type: DataTypes.ENUM("locked", "in-progress", "completed"),
        defaultValue: "locked",
      },
      stars_earned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 3,
        },
      },
      is_review: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      xp_earned: {
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
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      first_completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "lesson_progress",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "lesson_id"],
        },
      ],
    }
  );

  LessonProgress.associate = (models) => {
    LessonProgress.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    LessonProgress.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });
    LessonProgress.belongsTo(models.Lesson, {
      foreignKey: "lesson_id",
      as: "lesson",
    });
  };

  return LessonProgress;
};
