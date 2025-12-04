module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      avatar_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      subscription: {
        type: DataTypes.ENUM("Free", "Super"),
        defaultValue: "Free",
      },
      joined_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM("Active", "Inactive", "Banned"),
        defaultValue: "Active",
      },
      last_active: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
      },
    },
    {
      tableName: "users",
      timestamps: false,
    }
  );

  User.associate = (models) => {
    User.hasOne(models.UserProgress, {
      foreignKey: "user_id",
      as: "progress",
    });
    User.hasOne(models.UserCurrency, {
      foreignKey: "user_id",
      as: "currency",
    });
    User.hasMany(models.UserUnitProgress, {
      foreignKey: "user_id",
      as: "unitProgress",
    });
    // User.hasMany(models.UserLessonProgress, {
    //   foreignKey: "user_id",
    //   as: "lessonProgress",
    // });
    // User.hasMany(models.UserVocabulary, {
    //   foreignKey: "user_id",
    //   as: "vocabularyProgress",
    // });
    // User.hasMany(models.UserAchievement, {
    //   foreignKey: "user_id",
    //   as: "achievements",
    // });
    // User.hasMany(models.UserDailyTask, {
    //   foreignKey: "user_id",
    //   as: "dailyTasks",
    // });
    // User.hasMany(models.GameSession, {
    //   foreignKey: "user_id",
    //   as: "gameSessions",
    // });
    // User.hasMany(models.Transaction, {
    //   foreignKey: "user_id",
    //   as: "transactions",
    // });
    // User.hasMany(models.Feedback, {
    //   foreignKey: "user_id",
    //   as: "feedbacks",
    // });
  };

  return User;
};
