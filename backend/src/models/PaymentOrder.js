module.exports = (sequelize, DataTypes) => {
  const PaymentOrder = sequelize.define(
    "PaymentOrder",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      package_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: "e.g. Premium-Monthly, Premium-Yearly, Super-Monthly",
      },
      // SePay QR reference fields
      transfer_type: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "qr", // SePay always returns "qr"
      },
      trans_id: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: "Transaction ID from bank",
      },
      transfer_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      transfer_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      account_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: "Sender account number",
      },
      account_holder: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: "Sender account holder name",
      },
      bank_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: "Sender bank code",
      },
      description: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: "Payment description / transfer note",
      },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "cancelled"),
        defaultValue: "pending",
      },
      admin_note: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Admin user who reviewed this order",
      },
      reviewed_at: {
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
      tableName: "payment_orders",
      timestamps: false,
      updatedAt: "updated_at",
      createdAt: "created_at",
    }
  );

  PaymentOrder.associate = (models) => {
    PaymentOrder.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
      onDelete: "CASCADE",
    });
    PaymentOrder.belongsTo(models.User, {
      foreignKey: "reviewed_by",
      as: "reviewer",
    });
  };

  return PaymentOrder;
};
