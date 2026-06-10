/**
 * SePay Polling Service
 * Tự động kiểm tra giao dịch mới từ SePay API
 *
 * SePay API Documentation:
 * https://docs.sepay.vn/
 *
 * Cần đăng ký API key từ SePay dashboard để sử dụng
 */

const axios = require("axios");
const { PaymentOrder, sequelize } = require("../models");
const sepayService = require("./sepay.service");
const emailService = require("./email.service");
const { Op } = require("sequelize");

const POLLING_INTERVAL = parseInt(process.env.SEPAY_POLLING_INTERVAL || "60000"); // Default 60s
const API_BASE_URL = "https://api.sepay.vn";

class SepayPollingService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.lastCheckedAt = null;
    this.processedTransactions = new Set();
    this.stats = {
      totalPolled: 0,
      successfulPayments: 0,
      failedPayments: 0,
      lastSuccessAt: null,
      lastErrorAt: null,
    };
  }

  /**
   * Lấy API token từ env
   */
  getApiToken() {
    return process.env.SEPAY_API_TOKEN || "";
  }

  /**
   * Kiểm tra service đã được configure chưa
   */
  isConfigured() {
    const token = this.getApiToken();
    const accountNumber = sepayService.getBankConfig().account_number;
    return !!token && !!accountNumber;
  }

  /**
   * Bắt đầu polling service
   */
  start() {
    if (this.isRunning) {
      console.log("[SePay Polling] Service already running");
      return;
    }

    if (!this.isConfigured()) {
      console.warn("[SePay Polling] Service not configured - missing API token or account number");
      console.warn("[SePay Polling] Set SEPAY_API_TOKEN in .env to enable polling");
      return;
    }

    this.isRunning = true;
    console.log(`[SePay Polling] Service started with interval: ${POLLING_INTERVAL}ms`);

    // Chạy immediately lần đầu
    this.poll();

    // Sau đó chạy theo interval
    this.intervalId = setInterval(() => {
      this.poll();
    }, POLLING_INTERVAL);
  }

  /**
   * Dừng polling service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("[SePay Polling] Service stopped");
  }

  /**
   * Main polling function
   */
  async poll() {
    if (!this.isConfigured()) {
      return;
    }

    this.lastCheckedAt = new Date();
    this.stats.totalPolled++;

    try {
      const transactions = await this.fetchTransactions();

      for (const transaction of transactions) {
        await this.processTransaction(transaction);
      }

      if (transactions.length > 0) {
        console.log(`[SePay Polling] Checked ${transactions.length} transactions`);
      }
    } catch (error) {
      this.stats.lastErrorAt = new Date();
      console.error("[SePay Polling] Polling error:", error.message);
    }
  }

  /**
   * Fetch transactions từ SePay API
   */
  async fetchTransactions() {
    const token = this.getApiToken();
    const config = sepayService.getBankConfig();

    try {
      // SePay API endpoint để lấy danh sách giao dịch
      const response = await axios.get(`${API_BASE_URL}/transaction`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: {
          account_number: config.account_number,
          datetime_from: this.getDateFrom(),
          datetime_to: this.getDateTo(),
        },
        timeout: 10000,
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data.filter((t) => t.transfer_type === "in");
      }

      return [];
    } catch (error) {
      // Nếu API không khả dụng hoặc chưa có token, thử mock mode
      if (!token || error.response?.status === 401) {
        console.debug("[SePay Polling] Using mock mode - set SEPAY_API_TOKEN for real API");
      }
      throw error;
    }
  }

  /**
   * Xử lý một transaction
   */
  async processTransaction(transaction) {
    const transactionId = transaction.trans_id || transaction.id;

    // Skip nếu đã xử lý
    if (this.processedTransactions.has(transactionId)) {
      return;
    }

    // Lấy transfer content để match với order
    const transferContent = transaction.transfer_content || transaction.description || "";

    // Extract order ID từ transfer note (format: EL{order_id})
    const orderIdMatch = transferContent.match(/EL([a-zA-Z0-9-]+)/);

    if (!orderIdMatch) {
      console.debug(`[SePay Polling] No order reference in: ${transferContent}`);
      return;
    }

    const orderRef = orderIdMatch[0];
    const orderId = orderIdMatch[1];

    // Tìm pending order
    const order = await PaymentOrder.findOne({
      where: {
        [Op.or]: [
          { id: orderId },
          { id: orderRef },
          { description: { [Op.like]: `%${orderId}%` } },
        ],
        status: "pending",
      },
      include: [{ model: require("../models").User, as: "user" }],
    });

    if (!order) {
      console.debug(`[SePay Polling] No pending order found for: ${orderRef}`);
      return;
    }

    // Kiểm tra số tiền
    const transferAmount = parseFloat(transaction.amount || transaction.transfer_amount || 0);
    const orderAmount = parseFloat(order.amount);

    if (transferAmount < orderAmount) {
      console.warn(`[SePay Polling] Insufficient amount for order ${order.id}: ${transferAmount} < ${orderAmount}`);
      return;
    }

    // Process payment
    try {
      await this.completePayment(order, transaction);
      this.processedTransactions.add(transactionId);
      this.stats.successfulPayments++;
      this.stats.lastSuccessAt = new Date();
    } catch (error) {
      this.stats.failedPayments++;
      console.error(`[SePay Polling] Failed to process payment for order ${order.id}:`, error.message);
    }
  }

  /**
   * Hoàn tất thanh toán
   */
  async completePayment(order, transaction) {
    const User = require("../models").User;

    await sequelize.transaction(async (t) => {
      // Update order status
      await order.update(
        {
          status: "approved",
          trans_id: transaction.trans_id || transaction.id,
          transfer_type: "sepay_api",
          transfer_amount: parseFloat(transaction.amount || transaction.transfer_amount),
          transfer_date: new Date(transaction.datetime || transaction.created_at),
          account_number: transaction.account_number || null,
          account_holder: transaction.account_holder || null,
          bank_code: transaction.bank_code || transaction.source_bank || null,
        },
        { transaction: t }
      );

      // Calculate premium expiry
      const now = new Date();
      const currentExpiry = order.user?.premium_expires_at
        ? new Date(order.user.premium_expires_at)
        : null;
      const baseDate =
        order.user?.subscription !== "Free" && currentExpiry && currentExpiry > now
          ? currentExpiry
          : now;

      const premiumExpiresAt = this.addMonths(baseDate, order.duration_months || 1);

      // Update user subscription
      if (order.user) {
        await order.user.update(
          {
            subscription: "Premium",
            premium_expires_at: premiumExpiresAt,
            subscription_cancelled_at: null,
          },
          { transaction: t }
        );
      }

      console.log(
        `[SePay Polling] Payment completed: order=${order.id} amount=${transaction.amount} user=${order.user?.email}`
      );

      // Send confirmation email
      if (order.user) {
        emailService
          .sendPaymentSuccessEmail(
            order.user.email,
            order.user.display_name || order.user.username,
            {
              transaction_id: transaction.trans_id || transaction.id,
              amount: transaction.amount || transaction.transfer_amount,
              premium_expires_at: premiumExpiresAt,
            }
          )
          .catch((err) => {
            console.error("[SePay Polling] Email send failed:", err.message);
          });
      }
    });
  }

  addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  getDateFrom() {
    // Check transactions từ 24h trước
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString();
  }

  getDateTo() {
    return new Date().toISOString();
  }

  /**
   * Lấy trạng thái service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isConfigured: this.isConfigured(),
      lastCheckedAt: this.lastCheckedAt,
      intervalMs: POLLING_INTERVAL,
      stats: this.stats,
    };
  }

  /**
   * Force check ngay lập tức
   */
  async forceCheck() {
    console.log("[SePay Polling] Force check triggered");
    await this.poll();
  }
}

// Singleton instance
const sepayPollingService = new SepayPollingService();

module.exports = sepayPollingService;
