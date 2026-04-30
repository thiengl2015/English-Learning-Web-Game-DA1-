module.exports = (sequelize, DataTypes) => {
  const Mission = sequelize.define(
    "Mission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM("daily", "achievement"),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: "Unique code to identify the mission: login, flashcard, lesson, streak_10, etc.",
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING(50),
        defaultValue: "🌟",
      },
      target: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Target count to complete the mission",
      },
      xp_reward: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      chain_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Previous mission code that must be completed first (for achievement chains)",
      },
      order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Display order in the list",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      reset_daily: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "If true, resets daily at midnight",
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Mission only available from this date",
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Mission only available until this date",
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
      tableName: "missions",
      timestamps: false,
    }
  );

  Mission.associate = (models) => {
    Mission.hasMany(models.UserMission, {
      foreignKey: "mission_id",
      as: "userProgress",
      onDelete: "CASCADE",
    });
  };

  return Mission;
};
