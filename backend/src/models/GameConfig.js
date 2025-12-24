module.exports = (sequelize, DataTypes) => {
  const GameConfig = sequelize.define(
    "GameConfig",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      game_type: {
        type: DataTypes.ENUM(
          "galaxy-match",
          "planetary-order",
          "rescue-mission",
          "signal-check"
        ),
        allowNull: false,
        comment: "4 loại game",
      },
      unit_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "units",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "lessons",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      difficulty: {
        type: DataTypes.ENUM("easy", "medium", "hard"),
        defaultValue: "medium",
      },
      questions_count: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        comment: "Số câu hỏi trong game",
      },
      time_limit: {
        type: DataTypes.INTEGER,
        defaultValue: 120,
        comment: "Giới hạn thời gian (seconds), 0 = unlimited",
      },
      passing_score: {
        type: DataTypes.INTEGER,
        defaultValue: 70,
        comment: "Điểm tối thiểu để pass (%)",
      },
      xp_reward: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
        comment: "XP thưởng khi hoàn thành",
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
      tableName: "game_config",
      timestamps: false,
      hooks: {
        beforeUpdate: (config) => {
          config.updated_at = new Date();
        },
      },
    }
  );

  GameConfig.associate = (models) => {
    GameConfig.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });

    GameConfig.belongsTo(models.Lesson, {
      foreignKey: "lesson_id",
      as: "lesson",
    });

    GameConfig.hasMany(models.GameSession, {
      foreignKey: "game_config_id",
      as: "sessions",
    });
  };

  return GameConfig;
};
