module.exports = (sequelize, DataTypes) => {
  // Generic key/value store for runtime markers (e.g. last weekly leaderboard reset).
  const SystemState = sequelize.define(
    "SystemState",
    {
      key: {
        type: DataTypes.STRING(100),
        primaryKey: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "system_state",
      timestamps: false,
      hooks: {
        beforeUpdate: (row) => {
          row.updated_at = new Date();
        },
      },
    }
  );

  return SystemState;
};
