/**
 * Payment Service
 * Handles premium subscription purchases for users.
 */

const { PaymentOrder, User, sequelize } = require("../models");
const sepayService = require("./sepay.service");
const emailService = require("./email.service");
const notificationService = require("./notification.service");
const { Op } = require("sequelize");

const MONTHLY_PREMIUM_PRICE = Number(process.env.PREMIUM_MONTHLY_PRICE || 99000);

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

class PaymentService {
  async createOrder(userId, packageType, months) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const pkg = this._resolvePackage(packageType, months);

    const order = await PaymentOrder.create({
      user_id: userId,
      amount: pkg.amount,
      package_type: pkg.type,
      duration_months: pkg.duration_months,
      status: "pending",
    });

    const qrImage = await sepayService.generateQRCodeImage({
      orderId: order.id,
      amount: pkg.amount,
      packageType: pkg.type,
    });

    const config = sepayService.getBankConfig();
    const transferNote = `${config.prefix}${order.id}`.substring(0, 25);

    await order.update({ description: transferNote });

    return this._formatOrder(order, {
      qr_image_base64: qrImage,
      transfer_note: transferNote,
      bank_info: {
        bank_name: "MB Bank",
        bank_code: config.bank_code,
        account_number: config.account_number,
        account_holder: config.account_holder,
      },
      package_info: pkg,
    });
  }

  async getOrderStatus(orderId, userId) {
    const order = await PaymentOrder.findOne({
      where: { id: orderId, user_id: userId },
      include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
    });

    if (!order) {
      throw new Error("Khong tim thay don hang");
    }

    return this._formatOrder(order);
  }

  async getMyOrders(userId, opts = {}) {
    const { page = 1, limit = 20, status } = opts;
    const offset = (page - 1) * limit;

    const rawStatusMap = {
      completed: "approved",
      canceled: ["cancelled", "rejected"],
      pending: "pending",
    };

    const where = { user_id: userId };
    if (status) {
      where.status = rawStatusMap[status] || status;
    }

    const { count, rows } = await PaymentOrder.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return {
      orders: rows.map((r) => this._formatOrder(r)),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async cancelOrder(orderId, userId) {
    const order = await PaymentOrder.findOne({
      where: { id: orderId, user_id: userId },
    });

    if (!order) {
      throw new Error("Khong tim thay don hang");
    }

    if (order.status !== "pending") {
      throw new Error("Chi co the huy don hang dang pending");
    }

    await order.update({ status: "cancelled" });
    return this._formatOrder(order);
  }

  async completeOrder(orderId, userId, paymentInfo = {}) {
    const result = await sequelize.transaction(async (transaction) => {
      const order = await PaymentOrder.findOne({
        where: { id: orderId, user_id: userId },
        include: [{ model: User, as: "user" }],
        transaction,
        lock: true,
      });

      if (!order) {
        throw new Error("Khong tim thay don hang");
      }

      if (order.status !== "pending") {
        return { formatted: this._formatOrder(order), justUpgraded: false };
      }

      if (!order.user) {
        throw new Error("Khong tim thay nguoi dung lien quan");
      }

      const pkg = this._resolvePackage(order.package_type, order.duration_months);
      const now = new Date();
      const currentExpiry = order.user.premium_expires_at
        ? new Date(order.user.premium_expires_at)
        : null;
      const baseDate =
        order.user.subscription !== "Free" && currentExpiry && currentExpiry > now
          ? currentExpiry
          : now;
      const premiumExpiresAt = addMonths(baseDate, pkg.duration_months);
      const transactionId = paymentInfo.trans_id || `SIM-${Date.now()}`;

      await order.update(
        {
          status: "approved",
          trans_id: transactionId,
          transfer_type: paymentInfo.transfer_type || "qr",
          transfer_amount: paymentInfo.transfer_amount || order.amount,
          transfer_date: paymentInfo.transfer_date || now,
          account_number: paymentInfo.account_number || null,
          account_holder: paymentInfo.account_holder || null,
          bank_code: paymentInfo.bank_code || null,
          premium_expires_at: premiumExpiresAt,
        },
        { transaction }
      );

      await order.user.update(
        {
          subscription: pkg.level,
          premium_expires_at: premiumExpiresAt,
          subscription_cancelled_at: null,
          updated_at: now,
        },
        { transaction }
      );

      const formatted = this._formatOrder(order, {
        user_subscription_upgraded_to: pkg.level,
        user_premium_expires_at: premiumExpiresAt,
      });

      console.log(
        `[Payment] completed order=${order.id} transaction=${transactionId} user=${order.user.email} amount=${Number(order.amount)} premium_until=${premiumExpiresAt.toISOString()}`
      );

      emailService
        .sendPaymentSuccessEmail(order.user.email, order.user.display_name || order.user.username, {
          transaction_id: transactionId,
          amount: order.amount,
          premium_expires_at: premiumExpiresAt,
        })
        .catch((error) => {
          console.error("[Payment] payment email failed:", error.message);
        });

      return {
        formatted,
        justUpgraded: true,
        userId: order.user.id,
        username: order.user.display_name || order.user.username,
      };
    });

    // Fire the personalized "premium_purchase" notification once the upgrade is committed.
    if (result.justUpgraded) {
      notificationService
        .deliverEventToUser("premium_purchase", result.userId, {
          username: result.username,
        })
        .catch((error) => {
          console.error("[Payment] premium notification failed:", error.message);
        });
    }

    return result.formatted;
  }

  async completeOrderFromWebhook(payload = {}) {
    const transferNote = this._extractTransferNote(payload);
    if (!transferNote) {
      throw new Error("Khong tim thay noi dung chuyen khoan");
    }

    const order = await PaymentOrder.findOne({
      where: {
        status: "pending",
        [Op.or]: [{ id: transferNote }, { description: transferNote }],
      },
    });

    if (!order) {
      throw new Error(`Khong tim thay don pending cho noi dung: ${transferNote}`);
    }

    const paidAmount = Number(payload.transfer_amount || payload.amount || 0);
    if (paidAmount && paidAmount < Number(order.amount)) {
      throw new Error(`So tien thanh toan khong du cho don ${order.id}`);
    }

    return this.completeOrder(order.id, order.user_id, {
      trans_id: payload.trans_id || payload.transaction_id || payload.id,
      transfer_type: payload.transfer_type || "sepay",
      transfer_amount: payload.transfer_amount || payload.amount,
      transfer_date: payload.transfer_date || payload.transaction_date,
      account_number: payload.account_number,
      account_holder: payload.account_holder,
      bank_code: payload.bank_code,
    });
  }

  async cancelSubscription(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.subscription === "Free") {
      throw new Error("Tai khoan hien dang la Free");
    }

    await user.update({ subscription_cancelled_at: new Date() });
    console.log(
      `[Payment] subscription cancellation requested user=${user.email} premium_until=${
        user.premium_expires_at ? new Date(user.premium_expires_at).toISOString() : "N/A"
      }`
    );

    return {
      subscription: user.subscription,
      premium_expires_at: user.premium_expires_at,
      subscription_cancelled_at: user.subscription_cancelled_at,
    };
  }

  async resumeSubscription(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await user.update({ subscription_cancelled_at: null });
    return {
      subscription: user.subscription,
      premium_expires_at: user.premium_expires_at,
      subscription_cancelled_at: user.subscription_cancelled_at,
    };
  }

  getPackages() {
    const packages = Object.entries(sepayService.PREMIUM_PACKAGES).map(([key, pkg]) => ({
      type: key,
      display_name: pkg.display_name,
      amount: pkg.amount,
      duration_days: pkg.duration_days,
      duration_months: Math.max(1, Math.round(pkg.duration_days / 30)),
      level: pkg.level,
    }));

    if (!packages.some((pkg) => pkg.duration_months === 6)) {
      packages.push(this._resolvePackage(null, 6));
    }

    return packages;
  }

  _formatOrder(order, extra = {}) {
    const data = order.toJSON ? order.toJSON() : order;
    const statusMap = {
      approved: "completed",
      rejected: "canceled",
      cancelled: "canceled",
    };

    return {
      id: data.id,
      user_id: data.user_id,
      package_type: data.package_type,
      duration_months: data.duration_months,
      amount: Number(data.amount),
      status: statusMap[data.status] || data.status,
      raw_status: data.status,
      transaction_id: data.trans_id || data.id,
      trans_id: data.trans_id,
      transfer_amount: data.transfer_amount ? Number(data.transfer_amount) : null,
      transfer_date: data.transfer_date,
      description: data.description,
      premium_expires_at: data.premium_expires_at,
      admin_note: data.admin_note,
      created_at: data.created_at,
      updated_at: data.updated_at,
      ...extra,
    };
  }

  _resolvePackage(packageType, months) {
    const knownPackage = packageType ? sepayService.PREMIUM_PACKAGES[packageType] : null;
    if (knownPackage) {
      const durationMonths = Math.max(1, Math.round(knownPackage.duration_days / 30));
      return {
        type: packageType,
        display_name: knownPackage.display_name,
        amount: knownPackage.amount,
        duration_days: knownPackage.duration_days,
        duration_months: durationMonths,
        level: knownPackage.level,
      };
    }

    const durationMonths = parseInt(months, 10);
    if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 24) {
      throw new Error("So thang thanh toan khong hop le");
    }

    return {
      type: `Premium-${durationMonths}-Month${durationMonths > 1 ? "s" : ""}`,
      display_name: `Premium - ${durationMonths} thang`,
      amount: MONTHLY_PREMIUM_PRICE * durationMonths,
      duration_days: durationMonths * 30,
      duration_months: durationMonths,
      level: "Premium",
    };
  }

  _extractTransferNote(payload) {
    const config = sepayService.getBankConfig();
    const raw = [
      payload.transfer_note,
      payload.description,
      payload.content,
      payload.transfer_content,
      payload.transaction_content,
    ]
      .filter(Boolean)
      .join(" ");

    if (!raw) return null;

    const escapedPrefix = config.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = raw.match(new RegExp(`${escapedPrefix}[a-zA-Z0-9-]+`));
    return (match ? match[0] : raw.trim()).substring(0, 25);
  }
}

module.exports = new PaymentService();
