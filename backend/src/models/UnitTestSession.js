module.exports = (sequelize, DataTypes) => {
  const UnitTestSession = sequelize.define(
    "UnitTestSession",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
      test_type: {
        type: DataTypes.ENUM("checkpoint", "challenge"),
        allowNull: false,
        comment: "Loai bai thi",
      },
      test_id: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "checkpoint-1, unit-1...",
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
      status: {
        type: DataTypes.ENUM("in_progress", "completed", "abandoned"),
        defaultValue: "in_progress",
      },
      answers_data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: "Dap an nguoi dung",
      },
      score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Tong diem",
      },
      pass: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      section_scores: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: "Diem theo section: {A:{correct,total}, B:{...}}",
      },
      section_details: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        comment: "Chi tiet tung cau",
      },
      time_spent_seconds: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Thoi gian lam bai (giay)",
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "completed_at",
      },
    },
    {
      tableName: "unit_test_sessions",
      underscored: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  UnitTestSession.associate = (models) => {
    UnitTestSession.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    UnitTestSession.belongsTo(models.UnitTestConfig, {
      foreignKey: "test_id",
      as: "config",
    });
  };

  return UnitTestSession;
};
