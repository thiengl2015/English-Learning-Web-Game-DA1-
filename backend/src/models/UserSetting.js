module.exports = (sequelize, DataTypes) => {
  const UserSetting = sequelize.define(
    "UserSetting",
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
      push_notifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      email_reminders: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sound_effects: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      background_music: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      music_volume: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 70,
        validate: {
          min: 0,
          max: 100,
        },
      },
      audio_volume: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 80,
        validate: {
          min: 0,
          max: 100,
        },
      },
      dark_mode: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
      tableName: "user_settings",
      timestamps: false,
      hooks: {
        beforeUpdate: (setting) => {
          setting.updated_at = new Date();
        },
      },
    }
  );

  UserSetting.associate = (models) => {
    UserSetting.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
  };

  return UserSetting;
};
