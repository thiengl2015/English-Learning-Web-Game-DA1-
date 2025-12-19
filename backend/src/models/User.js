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
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      subscription: {
        type: DataTypes.ENUM("Free", "Premium", "Super"),
        defaultValue: "Free",
      },
      native_language: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "vi", // Vietnamese default
      },
      current_level: {
        type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
        defaultValue: "beginner",
      },
      learning_goal: {
        type: DataTypes.ENUM(
          "travel",
          "work",
          "ielts",
          "toeic",
          "daily",
          "academic"
        ),
        defaultValue: "daily",
      },
      daily_goal: {
        type: DataTypes.INTEGER,
        defaultValue: 15,
        comment: "Daily study goal in minutes",
      },
      joined_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      status: {
        type: DataTypes.ENUM("Active", "Inactive"),
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
      // For password reset
      reset_token: {
        type: DataTypes.STRING(6),
        allowNull: true,
      },
      reset_token_expires: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: "users",
      timestamps: false,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password_hash) {
            const bcrypt = require("bcryptjs");
            const salt = await bcrypt.genSalt(10);
            user.password_hash = await bcrypt.hash(user.password_hash, salt);
          }
        },
        beforeUpdate: async (user) => {
          user.updated_at = new Date();
        },
      },
    }
  );

  User.associate = (models) => {
    User.hasOne(models.UserProgress, {
      foreignKey: "user_id",
      as: "progress",
      onDelete: "CASCADE",
    });
  };

  User.prototype.comparePassword = async function (candidatePassword) {
    const bcrypt = require("bcryptjs");
    return await bcrypt.compare(candidatePassword, this.password_hash);
  };

  return User;
};
