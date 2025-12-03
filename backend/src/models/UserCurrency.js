module.exports = (sequelize, DataTypes) => {
  const UserCurrency = sequelize.define(
    "UserCurrency",
    {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      crystals: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      crowns: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "user_currency",
      timestamps: false,
    }
  );

  UserCurrency.associate = (models) => {
    UserCurrency.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
  };

  return UserCurrency;
};
