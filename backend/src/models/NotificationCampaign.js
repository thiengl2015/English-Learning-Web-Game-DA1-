module.exports = (sequelize, DataTypes) => {
  const NotificationCampaign = sequelize.define(
    "NotificationCampaign",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      audience: {
        type: DataTypes.ENUM("all", "free", "premium", "inactive"),
        allowNull: false,
        defaultValue: "all",
      },
      trigger_type: {
        type: DataTypes.ENUM(
          "schedule",
          "level_reached",
          "units_completed",
          "streak",
          "xp_milestone",
          "resume_activity"
        ),
        allowNull: false,
        defaultValue: "schedule",
      },
      // { scheduled_at, level, units, streak_days, xp, inactive_days }
      trigger_config: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("draft", "scheduled", "active", "sent", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      sent_at: {
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
      tableName: "notification_campaigns",
      timestamps: false,
      hooks: {
        beforeUpdate: (row) => {
          row.updated_at = new Date();
        },
      },
    }
  );

  return NotificationCampaign;
};
