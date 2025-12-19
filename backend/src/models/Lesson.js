module.exports = (sequelize, DataTypes) => {
  const Lesson = sequelize.define(
    "Lesson",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      unit_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "units",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("vocabulary", "practice", "test"),
        allowNull: false,
      },
      order_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      tableName: "lessons",
      timestamps: false,
      hooks: {
        beforeUpdate: (lesson) => {
          lesson.updated_at = new Date();
        },
      },
    }
  );

  Lesson.associate = (models) => {
    Lesson.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });
  };

  return Lesson;
};
