module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define(
    "Feedback",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      type: {
        type: DataTypes.ENUM("Review", "Suggestion", "Bug Report"),
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("unread", "read", "resolved"),
        defaultValue: "unread",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "feedback",
      timestamps: false,
    }
  );

  Feedback.associate = (models) => {
    Feedback.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return Feedback;
};
module.exports = (sequelize, DataTypes) => {
  const Feedback = sequelize.define(
    "Feedback",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      type: {
        type: DataTypes.ENUM("Review", "Suggestion", "Bug Report"),
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5,
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("unread", "read", "resolved"),
        defaultValue: "unread",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      resolved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "feedback",
      timestamps: false,
    }
  );

  Feedback.associate = (models) => {
    Feedback.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return Feedback;
};
