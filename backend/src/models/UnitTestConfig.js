module.exports = (sequelize, DataTypes) => {
  const UnitTestConfig = sequelize.define(
    "UnitTestConfig",
    {
      id: {
        type: DataTypes.STRING(50),
        primaryKey: true,
        allowNull: false,
        comment: "checkpoint-1, checkpoint-2, unit-1, unit-2...",
      },
      test_type: {
        type: DataTypes.ENUM("checkpoint", "challenge"),
        allowNull: false,
        comment: "Loai bai thi",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: "Tieu de bai thi",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Mo ta chi tiet",
      },
      units_covered: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Mang unit ID [1,2,3] chi checkpoint",
      },
      unit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Unit ID chi challenge",
      },
      pass_threshold: {
        type: DataTypes.INTEGER,
        defaultValue: 80,
        comment: "Phan tram de pass (checkpoint: 80, challenge: 50)",
      },
      total_score: {
        type: DataTypes.INTEGER,
        defaultValue: 20,
        comment: "Tong diem (checkpoint: 20, challenge: 10)",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "unit_test_configs",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  UnitTestConfig.associate = (models) => {
    UnitTestConfig.hasMany(models.UnitTestSession, {
      foreignKey: "test_id",
      as: "sessions",
    });
    UnitTestConfig.hasMany(models.QuestionCheckpoint, {
      foreignKey: "checkpoint_id",
      as: "checkpointQuestions",
    });
    UnitTestConfig.hasMany(models.QuestionChallenge, {
      foreignKey: "unit_id",
      as: "challengeQuestions",
    });
  };

  return UnitTestConfig;
};
