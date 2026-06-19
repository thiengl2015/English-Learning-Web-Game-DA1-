/**
 * Moderation client — gọi dịch vụ kiểm duyệt Python (sidecar) qua HTTP.
 *
 * Sidecar chạy 2 model mã nguồn mở:
 *   - văn bản:  tarudesu/ViSoBERT-HSD          (CLEAN / OFFENSIVE / HATE)
 *   - hình ảnh: Falconsai/nsfw_image_detection (normal / nsfw)
 * Xem moderation-service/README.md để cài đặt và chạy.
 *
 * Chính sách đã chốt:
 *   - Vượt ngưỡng  -> chặn + cảnh báo người gửi (service ném ContentBlockedError).
 *   - Service lỗi  -> fail-open (vẫn cho gửi, chỉ ghi log) khi MODERATION_FAIL_OPEN!=false.
 *   - Ngưỡng nằm ở backend/.env (TEXT/IMAGE threshold), sidecar chỉ trả điểm số.
 */

const num = (value, fallback) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ENABLED = process.env.MODERATION_ENABLED !== "false";
const BASE_URL = (process.env.MODERATION_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const TEXT_THRESHOLD = num(process.env.MODERATION_TEXT_THRESHOLD, 0.5);
const IMAGE_THRESHOLD = num(process.env.MODERATION_IMAGE_THRESHOLD, 0.7);
const TIMEOUT_MS = num(process.env.MODERATION_TIMEOUT_MS, 4000);
const FAIL_OPEN = process.env.MODERATION_FAIL_OPEN !== "false";

class ContentBlockedError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "ContentBlockedError";
    this.statusCode = 400;
    this.code = "CONTENT_BLOCKED";
    this.details = details;
  }
}

async function postWithTimeout(path, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) {
      throw new Error(`moderation service responded ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

class ModerationService {
  isEnabled() {
    return ENABLED;
  }

  /**
   * Kiểm duyệt văn bản. Trả về { flagged, skipped, violationScore, topLabel, labels }.
   * Không bao giờ ném lỗi vì sự cố mạng — ném ContentBlockedError CHỈ khi vi phạm.
   */
  async moderateText(text) {
    const value = (text || "").trim();
    if (!ENABLED || !value) {
      return { flagged: false, skipped: !ENABLED, violationScore: 0 };
    }

    try {
      const result = await postWithTimeout("/moderate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const violationScore = num(result.violation_score, 0);
      const flagged = violationScore >= TEXT_THRESHOLD;
      return {
        flagged,
        skipped: false,
        violationScore,
        topLabel: result.top_label,
        labels: result.labels,
      };
    } catch (error) {
      return this.handleServiceError("text", error);
    }
  }

  async assertTextAllowed(text, message = "Tin nhắn chứa nội dung không phù hợp và đã bị chặn.") {
    const verdict = await this.moderateText(text);
    if (verdict.flagged) {
      throw new ContentBlockedError(message, {
        violationScore: verdict.violationScore,
        topLabel: verdict.topLabel,
        labels: verdict.labels,
      });
    }
    return verdict;
  }

  /**
   * Kiểm duyệt ảnh từ buffer (đọc lại từ file đã upload).
   */
  async moderateImage(buffer, filename, mimeType) {
    if (!ENABLED || !buffer || !buffer.length) {
      return { flagged: false, skipped: !ENABLED, violationScore: 0 };
    }

    try {
      const form = new FormData();
      form.append(
        "image",
        new Blob([buffer], { type: mimeType || "application/octet-stream" }),
        filename || "image"
      );
      const result = await postWithTimeout("/moderate/image", {
        method: "POST",
        body: form,
      });
      const violationScore = num(result.violation_score, 0);
      const flagged = violationScore >= IMAGE_THRESHOLD;
      return {
        flagged,
        skipped: false,
        violationScore,
        topLabel: result.top_label,
        labels: result.labels,
      };
    } catch (error) {
      return this.handleServiceError("image", error);
    }
  }

  handleServiceError(kind, error) {
    const message = error?.name === "AbortError" ? "timeout" : error?.message || String(error);
    if (FAIL_OPEN) {
      console.warn(
        `[moderation] ${kind} check skipped (fail-open): ${message}. ` +
          `Đảm bảo sidecar đang chạy tại ${BASE_URL} (xem moderation-service/README.md).`
      );
      return { flagged: false, skipped: true, violationScore: 0, error: message };
    }
    // fail-closed: coi như bị chặn để tuyệt đối an toàn.
    throw new ContentBlockedError(
      "Hệ thống kiểm duyệt tạm thời không khả dụng, vui lòng thử lại sau.",
      { kind, serviceError: message }
    );
  }
}

const moderationService = new ModerationService();
moderationService.ContentBlockedError = ContentBlockedError;

module.exports = moderationService;
module.exports.ContentBlockedError = ContentBlockedError;
