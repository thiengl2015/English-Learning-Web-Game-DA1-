module.exports = (sequelize, DataTypes) => {
  const Grammar = sequelize.define(
    "Grammar",
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
        onDelete: "CASCADE",
      },
      lesson_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "lessons",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      pattern: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      explanation: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      example: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      translation: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      order_index: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
      tableName: "grammar",
      timestamps: false,
      hooks: {
        beforeUpdate: (grammar) => {
          grammar.updated_at = new Date();
        },
      },
    }
  );

  Grammar.associate = (models) => {
    Grammar.belongsTo(models.Unit, {
      foreignKey: "unit_id",
      as: "unit",
    });
    Grammar.belongsTo(models.Lesson, {
      foreignKey: "lesson_id",
      as: "lesson",
    });
  };

  return Grammar;
};
