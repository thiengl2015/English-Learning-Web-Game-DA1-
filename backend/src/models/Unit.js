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
        type: DataTypes.STRING(255),
        allowNull: true,
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
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "units",
      timestamps: false,
      hooks: {
        beforeUpdate: (unit) => {
          unit.updated_at = new Date();
        },
      },
    }
  );

  Unit.associate = (models) => {
    Unit.hasMany(models.Lesson, {
      foreignKey: "unit_id",
      as: "lessons",
    });
  };

  return Unit;
};
