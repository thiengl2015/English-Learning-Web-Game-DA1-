# Moderation Sidecar — Kiểm duyệt nội dung chat

Dịch vụ Python nhỏ (FastAPI) chạy **đúng 2 mô hình mã nguồn mở** nêu trong báo cáo,
để backend Node gọi qua HTTP localhost:

| Loại | Mô hình | Nhãn |
| --- | --- | --- |
| Văn bản | `tarudesu/ViSoBERT-HSD` | CLEAN / OFFENSIVE / HATE (tiếng Việt) |
| Hình ảnh | `Falconsai/nsfw_image_detection` | normal / nsfw |

Backend Node (`backend/src/services/moderation.service.js`) gọi dịch vụ này khi
người dùng gửi **tin nhắn văn bản** và khi **upload ảnh** trong chat. Dịch vụ chỉ
trả về điểm số; backend áp ngưỡng và quyết định chặn (giữ ngưỡng tại `backend/.env`).

> ⚠️ Vì sao tách riêng? Hai model là PyTorch/HuggingFace chạy trên Python, không chạy
> trực tiếp trong Node. Tách thành sidecar giúp dùng đúng model gốc, miễn phí và chạy
> offline sau khi tải model lần đầu.

## 1. Cài đặt

Khuyến nghị **Python 3.10–3.12** (PyTorch thường chưa có sẵn wheel cho 3.13/3.14 —
máy này đang là Python 3.14, nên có thể cần cài thêm một bản 3.11/3.12).

```bash
cd moderation-service

# Tạo môi trường ảo (ví dụ dùng py 3.12 trên Windows)
py -3.12 -m venv .venv
.venv\Scripts\activate          # Windows PowerShell
# source .venv/bin/activate     # macOS/Linux

pip install -r requirements.txt
```

Nếu không có GPU, mặc định cài bản CPU của PyTorch (đủ dùng cho kiểm duyệt chat).

## 2. Tải model (tự động lần chạy đầu)

Lần khởi động đầu tiên, `transformers` sẽ tự **tải model về** từ HuggingFace Hub
(~vài trăm MB) và cache vào `~/.cache/huggingface`. Cần internet **một lần**; sau đó
chạy offline. Muốn tải trước, chỉ cần khởi động dịch vụ một lần.

## 3. Chạy dịch vụ

1) Bật sidecar (khuyến nghị Python 3.10–3.12, KHÔNG dùng 3.14 vì torch chưa có wheel)
cd moderation-service
py -3.12 -m venv .venv ; .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000   # lần đầu tự tải model (~vài trăm MB)

2) Chạy backend như bình thường (đã đọc .env)
cd ..\backend ; npm run dev

```bash
uvicorn app:app --host 127.0.0.1 --port 8000
```

Kiểm tra: mở `http://127.0.0.1:8000/health` — `text_loaded` và `image_loaded` phải là `true`.

## 4. Bật trong backend Node

Trong `backend/.env` (đã thêm sẵn các khoá, có thể chỉnh):

```env
MODERATION_ENABLED=true
MODERATION_URL=http://127.0.0.1:8000
MODERATION_TEXT_THRESHOLD=0.5     # violation_score >= 0.5 -> chặn text
MODERATION_IMAGE_THRESHOLD=0.7    # nsfw score >= 0.7 -> chặn ảnh
MODERATION_TIMEOUT_MS=4000
MODERATION_FAIL_OPEN=true         # service lỗi -> vẫn cho gửi (chỉ ghi log)
```

- **fail-open**: nếu sidecar chưa bật / lỗi / timeout, chat vẫn hoạt động bình thường
  (chỉ ghi cảnh báo log). Đặt `MODERATION_FAIL_OPEN=false` để chặn khi service lỗi.
- Tắt hẳn kiểm duyệt: `MODERATION_ENABLED=false`.

## 5. API

```
GET  /health
POST /moderate/text   body JSON: { "text": "..." }
POST /moderate/image  multipart form-data: field "image" = file ảnh
```

Phản hồi mẫu:

```json
// /moderate/text
{ "model": "tarudesu/ViSoBERT-HSD",
  "labels": { "CLEAN": 0.04, "OFFENSIVE": 0.03, "HATE": 0.93 },
  "top_label": "HATE", "violation_score": 0.96 }

// /moderate/image
{ "model": "Falconsai/nsfw_image_detection",
  "labels": { "normal": 0.02, "nsfw": 0.98 },
  "top_label": "nsfw", "violation_score": 0.98 }
```

## Ghi chú

- `ViSoBERT-HSD` chỉ tốt với **tiếng Việt**; văn bản tiếng Anh sẽ kiểm duyệt kém
  (đúng phạm vi đồ án đã chốt).
- Tin nhắn **thoại (voice)** hiện không kiểm duyệt (không có bước speech-to-text).
