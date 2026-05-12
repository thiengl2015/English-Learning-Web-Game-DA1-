/**
 * Admin Payment Service
 * Handles premium order approval / rejection.
 *
 * Admin flow (manual review, no webhook):
 *   1. getPendingOrders()   -> list orders awaiting review
 *   2. getAllOrders()        -> all orders with filters
 *   3. approveOrder()        -> upgrade user subscription
 *   4. rejectOrder()         -> mark order as rejected
 */

const { PaymentOrder, User } = require("../models");
const sepayService = require("./sepay.service");

const { Op } = require("sequelize");

class AdminPaymentService {
  /**
   * Get all orders (admin view, paginated).
   *
   * @param {object} filters  { page, limit, status, user_id, search }
   */
  async getAllOrders(filters = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      user_id,
      search,
      start_date,
      end_date,
    } = filters;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (user_id) where.user_id = user_id;

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at[Op.gte] = new Date(start_date);
      if (end_date) where.created_at[Op.lte] = new Date(end_date + "T23:59:59");
    }

    if (search) {
      where[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { "$user.username$": { [Op.like]: `%${search}%` } },
        { "$user.email$": { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await PaymentOrder.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "email", "subscription", "created_at"],
          required: search ? true : false,
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "username"],
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
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get only pending orders (for admin review page).
   */
  async getPendingOrders(filters = {}) {
    return this.getAllOrders({ ...filters, status: "pending" });
  }

  /**
   * Approve a payment order and upgrade the user's subscription.
   *
   * @param {string} orderId
   * @param {string} adminId   - admin user performing the review
   * @param {string} adminNote - optional note
   */
  async approveOrder(orderId, adminId, adminNote = "") {
    const order = await PaymentOrder.findByPk(orderId, {
      include: [{ model: User, as: "user" }],
    });

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (order.status !== "pending") {
      throw new Error(
        `Đơn hàng đang ở trạng thái "${order.status}", không thể duyệt`
      );
    }

    if (!order.user) {
      throw new Error("Không tìm thấy người dùng liên quan");
    }

    const pkg = sepayService.PREMIUM_PACKAGES[order.package_type];
    if (!pkg) {
      throw new Error(`Package không hợp lệ: ${order.package_type}`);
    }

    await order.update({
      status: "approved",
      admin_note: adminNote,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    });

    await order.user.update({
      subscription: pkg.level,
      updated_at: new Date(),
    });

    return this._formatOrder(order, {
      user_subscription_upgraded_to: pkg.level,
    });
  }

  /**
   * Reject a payment order.
   *
   * @param {string} orderId
   * @param {string} adminId
   * @param {string} adminNote - required rejection reason
   */
  async rejectOrder(orderId, adminId, adminNote = "") {
    const order = await PaymentOrder.findByPk(orderId, {
      include: [{ model: User, as: "user" }],
    });

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    if (order.status !== "pending") {
      throw new Error(
        `Đơn hàng đang ở trạng thái "${order.status}", không thể từ chối`
      );
    }

    if (!adminNote || !adminNote.trim()) {
      throw new Error("Vui lòng nhập lý do từ chối (admin_note)");
    }

    await order.update({
      status: "rejected",
      admin_note: adminNote,
      reviewed_by: adminId,
      reviewed_at: new Date(),
    });

    return this._formatOrder(order);
  }

  /**
   * Get order by ID (admin, no user restriction).
   */
  async getOrderById(orderId) {
    const order = await PaymentOrder.findByPk(orderId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "username",
            "email",
            "subscription",
            "created_at",
          ],
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["id", "username"],
        },
      ],
    });

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng");
    }

    return this._formatOrder(order);
  }

  // ------------------------------------------------------------------
  // Private
  // ------------------------------------------------------------------
  _formatOrder(order, extra = {}) {
    const data = order.toJSON ? order.toJSON() : order;
    return {
      id: data.id,
      user_id: data.user_id,
      user: data.user
        ? {
            id: data.user.id,
            username: data.user.username,
            email: data.user.email,
            subscription: data.user.subscription,
            joined_at: data.user.created_at,
          }
        : null,
      amount: Number(data.amount),
      package_type: data.package_type,
      status: data.status,
      admin_note: data.admin_note,
      reviewed_by: data.reviewed_by,
      reviewer: data.reviewer
        ? { id: data.reviewer.id, username: data.reviewer.username }
        : null,
      reviewed_at: data.reviewed_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      transfer_type: data.transfer_type,
      trans_id: data.trans_id,
      transfer_amount: data.transfer_amount
        ? Number(data.transfer_amount)
        : null,
      transfer_date: data.transfer_date,
      account_number: data.account_number,
      account_holder: data.account_holder,
      bank_code: data.bank_code,
      description: data.description,
      ...extra,
    };
  }
}

module.exports = new AdminPaymentService();
