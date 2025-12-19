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

          if (userProgress.weekly_xp >= 3000) {
            userProgress.league = "Diamond";
          } else if (userProgress.weekly_xp >= 2000) {
            userProgress.league = "Gold";
          } else if (userProgress.weekly_xp >= 1000) {
            userProgress.league = "Silver";
          } else {
            userProgress.league = "Bronze";
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
