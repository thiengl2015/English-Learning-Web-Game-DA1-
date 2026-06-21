/**
 * SePay Service
 * Generates VietQR-compatible payment QR codes.
 *
 * Sử dụng VietQR API (https://vietqr.io/) thay vì tự build EMVCo payload.
 * Cách này được hỗ trợ bởi toàn bộ app ngân hàng, MoMo, ZaloPay, VNPay...
 *
 * Tài liệu: https://www.vietqr.io/danh-sach-api/tao-ma-qr/
 */

const QRCode = require("qrcode");

// ---------------------------------------------------------------------------
// Package definitions
// ---------------------------------------------------------------------------
const PREMIUM_PACKAGES = {
  "Premium-Monthly": {
    amount: 99000,
    display_name: "Premium - Goi Thang",
    duration_days: 30,
    level: "Premium",
  },
  "Premium-Quarterly": {
    amount: 249000,
    display_name: "Premium - Goi Quy",
    duration_days: 90,
    level: "Premium",
  },
  "Premium-Yearly": {
    amount: 799000,
    display_name: "Premium - Goi Nam",
    duration_days: 365,
    level: "Premium",
  },
  "Super-Monthly": {
    amount: 199000,
    display_name: "Super - Goi Thang",
    duration_days: 30,
    level: "Super",
  },
  "Super-Yearly": {
    amount: 1599000,
    display_name: "Super - Goi Nam",
    duration_days: 365,
    level: "Super",
  },
};

// ---------------------------------------------------------------------------
// Bank / SePay configuration (read from env)
// ---------------------------------------------------------------------------
function getBankConfig() {
  return {
    bank_id: process.env.SEPAY_BANK_ID || "MB",
    bank_bin: process.env.SEPAY_BANK_CODE || "970406",
    account_number: process.env.SEPAY_ACCOUNT_NUMBER || "",
    account_holder: process.env.SEPAY_ACCOUNT_HOLDER || "English Learning App",
    prefix: process.env.SEPAY_TRANSFER_PREFIX || "EL",
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateConfig(config) {
  if (!config.account_number) {
    throw new Error("[SePay] SEPAY_ACCOUNT_NUMBER is not set.");
  }
}

function validatePaymentInput({ orderId, amount }) {
  if (!orderId) throw new Error("[SePay] orderId is required.");
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new Error("[SePay] amount must be a positive number.");
  }
}

// ---------------------------------------------------------------------------
// VietQR URL builder
//
// VietQR cung cấp URL public để generate QR image, không cần tự build EMVCo:
//   https://img.vietqr.io/image/{BANK_BIN}-{ACCOUNT}-{TEMPLATE}.png
//     ?amount={AMOUNT}
//     &addInfo={DESCRIPTION}
//     &accountName={ACCOUNT_HOLDER}
//
// Template phổ biến: compact2, compact, qr_only, print
// ---------------------------------------------------------------------------
function buildVietQRUrl({ bankBin, accountNumber, amount, description, accountHolder }) {
  const template = "compact2";
  const base = `https://img.vietqr.io/image/${bankBin}-${accountNumber}-${template}.png`;

  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: description,
    accountName: accountHolder,
  });

  return `${base}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Build transfer note / order reference
// ---------------------------------------------------------------------------
function buildTransferNote(orderId) {
  const config = getBankConfig();
  // Chỉ dùng ASCII, bỏ dấu — tránh lỗi encoding trong nội dung chuyển khoản
  return `${config.prefix}${orderId}`.substring(0, 25);
}

// ---------------------------------------------------------------------------
// Generate QR payload string (dùng khi cần encode QR thủ công)
// Trả về VietQR URL — có thể encode thành QR hoặc dùng trực tiếp làm img src
// ---------------------------------------------------------------------------
function generateQRPayload({ orderId, amount, packageType }) {
  validatePaymentInput({ orderId, amount });
  const config = getBankConfig();
  validateConfig(config);

  const description = buildTransferNote(orderId);

  return buildVietQRUrl({
    bankBin: config.bank_bin,
    accountNumber: config.account_number,
    amount,
    description,
    accountHolder: config.account_holder,
  });
}

// ---------------------------------------------------------------------------
// Generate VietQR image URL
// Trả về URL của ảnh VietQR — dùng trực tiếp làm <img src>
// VietQR API tự động tạo ảnh QR chuyển khoản với đầy đủ thông tin:
//   - Tài khoản ngân hàng
//   - Số tiền
//   - Nội dung chuyển khoản
//   - Tên chủ tài khoản
// ---------------------------------------------------------------------------
async function generateQRCodeImage({ orderId, amount, packageType }) {
  const vietQRUrl = generateQRPayload({ orderId, amount, packageType });

  // Trả về URL VietQR trực tiếp — frontend sẽ dùng làm <img src>
  // VietQR API trả về ảnh PNG chứa mã QR chuyển khoản hoàn chỉnh
  return vietQRUrl;
}

// ---------------------------------------------------------------------------
// Generate QR code as raw PNG Buffer
// ---------------------------------------------------------------------------
async function generateQRCodeBuffer({ orderId, amount, packageType }) {
  const vietQRUrl = generateQRPayload({ orderId, amount, packageType });

  const buf = await QRCode.toBuffer(vietQRUrl, {
    errorCorrectionLevel: "M",
    type: "png",
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return buf;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
module.exports = {
  PREMIUM_PACKAGES,

  getBankConfig,
  generateQRPayload,
  generateQRCodeImage,
  generateQRCodeBuffer,

  // Utility — dùng trong payment.service.js để build transfer note
  buildTransferNote,
};