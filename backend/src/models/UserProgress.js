module.exports = (sequelize, DataTypes) => {
  const UserProgress = sequelize.define(
    "UserProgress",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      total_xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Lifetime XP earned",
      },
      weekly_xp: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Current week XP",
      },
      xp_this_week: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "XP earned this week for leaderboard",
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: "Calculated from total_xp",
      },
      streak_days: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Consecutive days of activity",
      },
      last_active_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: "Last login/activity date",
      },
      words_learned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Total vocabulary words learned",
      },
      total_study_minutes: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Total study time in minutes",
      },
      units_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Total units completed",
      },
      lessons_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Total lessons completed",
      },
      league: {
        type: DataTypes.ENUM("Bronze", "Silver", "Gold", "Diamond"),
        defaultValue: "Bronze",
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
      tableName: "user_progress",
      timestamps: false,
      hooks: {
        beforeUpdate: (userProgress) => {
          userProgress.updated_at = new Date();

          userProgress.level = Math.floor(userProgress.total_xp / 1000) + 1;

          // League is a persistent tier: it rises as weekly XP grows, but only the
          // weekly reset job demotes (bottom 3), so never downgrade it here. (Without
          // this guard, zeroing weekly_xp at reset would snap everyone back to Bronze.)
          const order = ["Bronze", "Silver", "Gold", "Diamond"];
          let derived = "Bronze";
          if (userProgress.weekly_xp >= 3000) {
            derived = "Diamond";
          } else if (userProgress.weekly_xp >= 2000) {
            derived = "Gold";
          } else if (userProgress.weekly_xp >= 1000) {
            derived = "Silver";
          }
          if (order.indexOf(derived) > order.indexOf(userProgress.league || "Bronze")) {
            userProgress.league = derived;
          }
        },
      },
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
