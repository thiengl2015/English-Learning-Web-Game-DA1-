/**
 * Payment Service
 * Handles premium/super subscription purchases.
 *
 * User flow:
 *   1. createOrder()       -> generates QR and saves pending order
 *   2. getOrderStatus()     -> returns order with payment details
 *   3. getMyOrders()        -> user's own payment history
 *
 * Admin flow (in admin-payment.service.js):
 *   4. approveOrder()        -> upgrades user subscription
 *   5. rejectOrder()         -> marks order as rejected
 *   6. getPendingOrders()   -> list pending orders for admin review
 */

const { PaymentOrder, User } = require("../models");
const sepayService = require("./sepay.service");
const userService = require("./user.service");

const { Op } = require("sequelize");

class PaymentService {
  /**
   * Create a new pending payment order and generate QR code image.
   *
   * @param {string} userId
   * @param {string} packageType  - key from PREMIUM_PACKAGES (e.g. "Premium-Monthly")
   * @returns {Promise<object>} order with qr_image_base64
   */
  async createOrder(userId, packageType) {
    const pkg = sepayService.PREMIUM_PACKAGES[packageType];
    if (!pkg) {
      throw new Error(`Invalid package type: ${packageType}`);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.subscription !== "Free") {
      throw new Error(
        `Tài khoản hiện tại là ${user.subscription}. Vui lòng hủy gói hiện tại trước khi mua gói mới.`
      );
    }

    const order = await PaymentOrder.create({
      user_id: userId,
      amount: pkg.amount,
      package_type: packageType,
      status: "pending",
    });

    const qrImage = await sepayService.generateQRCodeImage({
      orderId: order.id,
      amount: pkg.amount,
      packageType,
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
      package_info: {
        type: packageType,
        display_name: pkg.display_name,
        amount: pkg.amount,
        duration_days: pkg.duration_days,
        level: pkg.level,
      },
    });
  }

  /**
   * Get a single order by ID (only if it belongs to the requesting user).
   *
   * @param {string} orderId
   * @param {string} userId
   */
  async getOrderStatus(orderId, userId) {
    const order = await PaymentOrder.findOne({
      where: { id: orderId, user_id: userId },
      include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
    });

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return this._formatOrder(order);
  }

  /**
   * Get all orders for a user (paginated).
   *
   * @param {string} userId
   * @param {object} opts  { page, limit, status }
   */
  async getMyOrders(userId, opts = {}) {
    const { page = 1, limit = 20, status } = opts;
    const offset = (page - 1) * limit;

    const where = { user_id: userId };
    if (status) {
      where.status = status;
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

  /**
   * Cancel a pending order. Only allowed for pending orders.
   *
   * @param {string} orderId
   * @param {string} userId
   */
  async cancelOrder(orderId, userId) {
    const order = await PaymentOrder.findOne({
      where: { id: orderId, user_id: userId },
    });

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (order.status !== "pending") {
      throw new Error("Chỉ có thể hủy đơn ở trạng thái chờ duyệt");
    }

    await order.update({ status: "cancelled" });
    return this._formatOrder(order);
  }

  /**
   * Return available subscription packages.
   */
  getPackages() {
    return Object.entries(sepayService.PREMIUM_PACKAGES).map(
      ([key, pkg]) => ({
        type: key,
        display_name: pkg.display_name,
        amount: pkg.amount,
        duration_days: pkg.duration_days,
        level: pkg.level,
      })
    );
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------
  _formatOrder(order, extra = {}) {
    const data = order.toJSON ? order.toJSON() : order;
    return {
      id: data.id,
      user_id: data.user_id,
      package_type: data.package_type,
      amount: Number(data.amount),
      status: data.status,
      admin_note: data.admin_note,
      created_at: data.created_at,
      updated_at: data.updated_at,
      ...extra,
    };
  }
}

module.exports = new PaymentService();
