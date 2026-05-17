const { PaymentOrder, User } = require("../models");

const seedPayments = async () => {
  try {
    console.log("📦 Seeding payment orders...");

    await PaymentOrder.destroy({ where: {}, force: true });

    const users = await User.findAll({ limit: 3 });

    if (users.length === 0) {
      console.log("⚠️  Users not found. Please seed users first.");
      return;
    }

    const paymentData = [
      {
        user_id: users[0].id,
        amount: 99000,
        package_type: "Premium-Monthly",
        transfer_type: "qr",
        trans_id: "TPBANK123456",
        transfer_amount: 99000,
        transfer_date: new Date(Date.now() - 86400000 * 30),
        account_number: "1234567890",
        account_holder: "NGUYEN VAN A",
        bank_code: "TPB",
        description: "Thanh toan Premium Monthly",
        status: "approved",
        reviewed_at: new Date(Date.now() - 86400000 * 30 + 3600000),
      },
      {
        user_id: users[1].id,
        amount: 299000,
        package_type: "Super-Monthly",
        transfer_type: "qr",
        trans_id: "VCB987654",
        transfer_amount: 299000,
        transfer_date: new Date(Date.now() - 86400000 * 7),
        account_number: "0987654321",
        account_holder: "TRAN VAN B",
        bank_code: "VCB",
        description: "Thanh toan Super Monthly",
        status: "approved",
        reviewed_at: new Date(Date.now() - 86400000 * 7 + 3600000),
      },
      {
        user_id: users[2]?.id || users[0].id,
        amount: 99000,
        package_type: "Premium-Monthly",
        transfer_type: "qr",
        trans_id: "ACB555666",
        transfer_amount: 99000,
        transfer_date: new Date(),
        account_number: "5555666677",
        account_holder: "LE VAN C",
        bank_code: "ACB",
        description: "Thanh toan Premium",
        status: "pending",
        reviewed_at: null,
      },
    ];

    const payments = await PaymentOrder.bulkCreate(paymentData);
    console.log(`✅ Successfully seeded ${payments.length} payment orders!`);
    return payments;
  } catch (error) {
    console.error("❌ Error seeding payments:", error);
    throw error;
  }
};

module.exports = seedPayments;
