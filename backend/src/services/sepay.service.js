/**
 * SePay Service
 * Generates VietQR-compatible payment strings and QR code images.
 * Used for SePay-integrated bank transfers.
 *
 * VietQR format reference:
 * https://vietqr.io/
 *
 * QR payload format (EMVCo):
 * https://www.emvco.com/emv-standards/
 */

const QRCode = require("qrcode");

// ---------------------------------------------------------------------------
// Package definitions
// ---------------------------------------------------------------------------
const PREMIUM_PACKAGES = {
  "Premium-Monthly": {
    amount: 99000,
    display_name: "Premium - Gói Tháng",
    duration_days: 30,
    level: "Premium",
  },
  "Premium-Quarterly": {
    amount: 249000,
    display_name: "Premium - Gói Quý",
    duration_days: 90,
    level: "Premium",
  },
  "Premium-Yearly": {
    amount: 799000,
    display_name: "Premium - Gói Năm",
    duration_days: 365,
    level: "Premium",
  },
  "Super-Monthly": {
    amount: 199000,
    display_name: "Super - Gói Tháng",
    duration_days: 30,
    level: "Super",
  },
  "Super-Yearly": {
    amount: 1599000,
    display_name: "Super - Gói Năm",
    duration_days: 365,
    level: "Super",
  },
};

// ---------------------------------------------------------------------------
// Bank / SePay configuration (read from env)
// ---------------------------------------------------------------------------
function getBankConfig() {
  return {
    bank_id: process.env.SEPAY_BANK_ID || "MB",           // MBBank default
    bank_code: process.env.SEPAY_BANK_CODE || "970406",
    account_number: process.env.SEPAY_ACCOUNT_NUMBER || "",
    account_holder: process.env.SEPAY_ACCOUNT_HOLDER || "English Learning App",
    prefix: process.env.SEPAY_TRANSFER_PREFIX || "EL",
  };
}

// ---------------------------------------------------------------------------
// VietQR payload builder (EMVCo)
// ---------------------------------------------------------------------------

/**
 * Build a VietQR payload string for the given order details.
 * @param {string} orderId
 * @param {number} amount
 * @param {string} description
 * @returns {string} raw QR payload string
 */
function buildSimpleQRPayload(orderId, amount, description) {
  const config = getBankConfig();
  const cleanDesc = `${config.prefix}${orderId}`.substring(0, 25);

  // VietQR payload following EMVCo standard
  const parts = [
    { id: "00", value: "01" }, // Format indicator
    { id: "01", value: "12" }, // Point of initiation method: 12 = dynamic
    { id: "38", value: "0000" }, // Merchant category code
    { id: "52", value: "0000" }, // Industry identifier
    { id: "53", value: "704" }, // Currency: 704 = VND
    {
      id: "54",
      value: String(amount).replace(/\.00$/, "").replace(/\.(\d)$/, ".$1"),
    }, // Amount
    { id: "58", value: "VN" }, // Country
    { id: "59", value: config.account_holder }, // Merchant name
    { id: "60", value: "Ho Chi Minh" }, // Merchant city
    { id: "63", value: "00" }, // CRC
  ];

  let raw = "";
  for (const p of parts) {
    if (p.value !== undefined && p.value !== null && p.value !== "") {
      raw += p.id + String(p.value).length.toString().padStart(2, "0") + p.value;
    }
  }

  // Append additional data field (description / order reference)
  if (cleanDesc) {
    raw += "07" + cleanDesc.length.toString().padStart(2, "0") + cleanDesc;
  }

  // CRC-16/X25 checksum
  const crc = computeCRC16(raw);
  raw += "6304" + crc.toString().toUpperCase();

  return raw;
}

/**
 * CRC-16/CCITT (X.25) checksum used in VietQR.
 * @param {string} data
 * @returns {string} 4-char hex CRC
 */
function computeCRC16(data) {
  let crc = 0xffff;
  const table = getCRC16Table();

  for (let i = 0; i < data.length; i++) {
    const byte = data.charCodeAt(i);
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }

  crc = crc ^ 0xffff;
  const hex = crc.toString(16).toUpperCase().padStart(4, "0");
  return hex;
}

let _crc16Table = null;
function getCRC16Table() {
  if (_crc16Table) return _crc16Table;

  _crc16Table = new Uint16Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0x8408 ^ (c >>> 1) : c >>> 1;
    }
    _crc16Table[i] = c;
  }
  return _crc16Table;
}

// ---------------------------------------------------------------------------
// Main QR generation
// ---------------------------------------------------------------------------
/**
 * Generate a VietQR payment string (used as content for QR generation).
 *
 * @param {object} opts
 * @param {string} opts.orderId    - Internal order ID
 * @param {number} opts.amount    - Payment amount in VND
 * @param {string} opts.packageType - Package key from PREMIUM_PACKAGES
 * @returns {string} raw QR payload string
 */
function generateQRPayload({ orderId, amount, packageType }) {
  const config = getBankConfig();
  const ref = `${config.prefix}${orderId}`.substring(0, 25);
  return buildSimpleQRPayload(orderId, amount, ref);
}

/**
 * Generate a QR code image as a base64 data URL.
 *
 * @param {object} opts
 * @param {string} opts.orderId
 * @param {number} opts.amount
 * @param {string} opts.packageType
 * @returns {Promise<string>} data:image/png;base64,... string
 */
async function generateQRCodeImage({ orderId, amount, packageType }) {
  const payload = generateQRPayload({ orderId, amount, packageType });

  const qrDataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    type: "image/png",
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  return qrDataUrl;
}

/**
 * Generate a raw QR code as a Buffer (PNG).
 *
 * @param {object} opts
 * @returns {Promise<Buffer>}
 */
async function generateQRCodeBuffer({ orderId, amount, packageType }) {
  const payload = generateQRPayload({ orderId, amount, packageType });

  const buf = await QRCode.toBuffer(payload, {
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
// Exported
// ---------------------------------------------------------------------------
module.exports = {
  PREMIUM_PACKAGES,

  getBankConfig,
  generateQRPayload,
  generateQRCodeImage,
  generateQRCodeBuffer,

  /** Utility: compute CRC16 for any string (useful for debugging) */
  computeCRC16,
};
