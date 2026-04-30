module.exports = (sequelize, DataTypes) => {
  const UserMission = sequelize.define(
    "UserMission",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      mission_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "missions",
          key: "id",
        },
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Current progress towards the target",
      },
      status: {
        type: DataTypes.ENUM("in_progress", "completed", "claimed"),
        defaultValue: "in_progress",
      },
      claimed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When the reward was claimed",
      },
      last_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: "Last time progress was updated",
      },
      reset_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Date when the daily mission should reset",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "user_missions",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "mission_id", "reset_date"],
        },
      ],
    }
  );

  UserMission.associate = (models) => {
    UserMission.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
    UserMission.belongsTo(models.Mission, {
      foreignKey: "mission_id",
      as: "mission",
      onDelete: "CASCADE",
    });
  };

  return UserMission;
};
