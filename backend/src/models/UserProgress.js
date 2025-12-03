module.exports = (sequelize, DataTypes) => {
  const UserProgress = sequelize.define(
    "UserProgress",
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      units_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      words_learned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      streak_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_study_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      community_rank: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      daily_goal_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 15,
      },
      study_time_today: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "in seconds",
      },
      last_study_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "user_progress",
      timestamps: false,
    }
  );

  UserProgress.associate = (models) => {
    UserProgress.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return UserProgress;
};
