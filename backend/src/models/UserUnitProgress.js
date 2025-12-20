module.exports = (sequelize, DataTypes) => {
  const UserUnitProgress = sequelize.define(
    "UserUnitProgress",
    {
      user_id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      unit_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
          model: "units",
          key: "id",
        },
      },
      progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      crown_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      unlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "user_unit_progress",
      timestamps: false,
    }
  );

  UserUnitProgress.associate = (models) => {
    UserUnitProgress.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    UserUnitProgress.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });
  };

  return UserUnitProgress;
};
