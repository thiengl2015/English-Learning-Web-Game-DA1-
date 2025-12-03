module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define(
    "Unit",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      subtitle: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_lessons: {
        type: DataTypes.INTEGER,
        defaultValue: 15,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "units",
      timestamps: false,
    }
  );

  Unit.associate = (models) => {
    Unit.hasMany(models.Lesson, {
      foreignKey: "unit_id",
      as: "lessons",
    });
    Unit.hasMany(models.UserUnitProgress, {
      foreignKey: "unit_id",
      as: "userProgress",
    });
    Unit.hasMany(models.GameConfig, {
      foreignKey: "unit_id",
      as: "gameConfigs",
    });
    Unit.hasOne(models.Checkpoint, {
      foreignKey: "after_unit_id",
      as: "checkpoint",
    });
  };

  return Unit;
};
