"""
Moderation sidecar — dịch vụ kiểm duyệt nội dung cho chat người dùng.

Load đúng 2 mô hình mã nguồn mở được nêu trong báo cáo:
  - Văn bản:  tarudesu/ViSoBERT-HSD          (tiếng Việt: CLEAN / OFFENSIVE / HATE)
  - Hình ảnh: Falconsai/nsfw_image_detection (normal / nsfw)

Dịch vụ này CHỈ trả về điểm số (probability) cho từng nhãn + violation_score.
Việc quyết định "vượt ngưỡng / chặn" do backend Node thực hiện (giữ ngưỡng ở một
chỗ duy nhất trong backend/.env). Xem backend/src/services/moderation.service.js.

Chạy:
  uvicorn app:app --host 127.0.0.1 --port 8000
"""

import io
import os
import logging

from fastapi import FastAPI, File, UploadFile, HTTPException
from pydantic import BaseModel
from PIL import Image

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("moderation")

TEXT_MODEL_ID = os.getenv("TEXT_MODEL_ID", "tarudesu/ViSoBERT-HSD")
IMAGE_MODEL_ID = os.getenv("IMAGE_MODEL_ID", "Falconsai/nsfw_image_detection")

app = FastAPI(title="Content Moderation Sidecar", version="1.0.0")

# Pipelines được nạp lười (lazy) ở startup. Nếu nạp lỗi -> giữ None và báo
# qua /health; backend Node sẽ fail-open (vẫn cho gửi) khi gọi thất bại.
_text_pipe = None
_image_pipe = None
_text_index_to_label = {}


def _canonical_text_label(raw_label, index):
    """Chuẩn hoá nhãn của ViSoBERT-HSD về CLEAN / OFFENSIVE / HATE.

    Model có thể trả nhãn dạng 'LABEL_0/1/2' hoặc tên sẵn. ViHSD theo thứ tự
    chuẩn: 0=CLEAN, 1=OFFENSIVE, 2=HATE.
    """
    text = str(raw_label).strip().upper()
    if "CLEAN" in text or text in ("LABEL_0", "0"):
        return "CLEAN"
    if "OFFENSIVE" in text or text in ("LABEL_1", "1"):
        return "OFFENSIVE"
    if "HATE" in text or text in ("LABEL_2", "2"):
        return "HATE"
    fallback = {0: "CLEAN", 1: "OFFENSIVE", 2: "HATE"}
    return fallback.get(index, text or f"LABEL_{index}")


def _canonical_image_label(raw_label):
    """Chuẩn hoá nhãn ảnh về normal / nsfw."""
    text = str(raw_label).strip().lower()
    if "nsfw" in text or text in ("label_1", "1", "porn", "sexy"):
        return "nsfw"
    return "normal"


@app.on_event("startup")
def load_models():
    global _text_pipe, _image_pipe, _text_index_to_label
    try:
        from transformers import pipeline

        logger.info("Đang nạp model văn bản: %s ...", TEXT_MODEL_ID)
        _text_pipe = pipeline("text-classification", model=TEXT_MODEL_ID, top_k=None)
        id2label = getattr(_text_pipe.model.config, "id2label", {}) or {}
        _text_index_to_label = {
            int(idx): _canonical_text_label(name, int(idx)) for idx, name in id2label.items()
        }
        logger.info("Model văn bản OK. Nhãn: %s", _text_index_to_label)
    except Exception as exc:  # noqa: BLE001
        logger.error("Không nạp được model văn bản (%s): %s", TEXT_MODEL_ID, exc)
        _text_pipe = None

    try:
        from transformers import pipeline

        logger.info("Đang nạp model hình ảnh: %s ...", IMAGE_MODEL_ID)
        _image_pipe = pipeline("image-classification", model=IMAGE_MODEL_ID, top_k=None)
        logger.info("Model hình ảnh OK.")
    except Exception as exc:  # noqa: BLE001
        logger.error("Không nạp được model hình ảnh (%s): %s", IMAGE_MODEL_ID, exc)
        _image_pipe = None


@app.get("/health")
def health():
    return {
        "status": "ok",
        "text_model": TEXT_MODEL_ID,
        "image_model": IMAGE_MODEL_ID,
        "text_loaded": _text_pipe is not None,
        "image_loaded": _image_pipe is not None,
    }


class TextRequest(BaseModel):
    text: str


def _scores_from_pipeline_output(output):
    """pipeline(top_k=None) trả về list[dict{label,score}] (đôi khi lồng 1 cấp)."""
    if isinstance(output, list) and output and isinstance(output[0], list):
        output = output[0]
    return output or []


@app.post("/moderate/text")
def moderate_text(req: TextRequest):
    if _text_pipe is None:
        raise HTTPException(status_code=503, detail="Text model not loaded")

    text = (req.text or "").strip()
    if not text:
        return {
            "model": TEXT_MODEL_ID,
            "labels": {},
            "top_label": "CLEAN",
            "violation_score": 0.0,
        }

    raw = _scores_from_pipeline_output(_text_pipe(text))
    labels = {}
    for index, item in enumerate(raw):
        canonical = _canonical_text_label(item.get("label"), index)
        labels[canonical] = float(item.get("score", 0.0))

    clean_score = labels.get("CLEAN", 0.0)
    # violation_score = xác suất KHÔNG sạch = OFFENSIVE + HATE (softmax nên = 1 - CLEAN).
    violation_score = max(0.0, 1.0 - clean_score)
    top_label = max(labels, key=labels.get) if labels else "CLEAN"

    return {
        "model": TEXT_MODEL_ID,
        "labels": labels,
        "top_label": top_label,
        "violation_score": round(violation_score, 6),
    }


@app.post("/moderate/image")
async def moderate_image(image: UploadFile = File(...)):
    if _image_pipe is None:
        raise HTTPException(status_code=503, detail="Image model not loaded")

    data = await image.read()
    try:
        pil_image = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}")

    raw = _scores_from_pipeline_output(_image_pipe(pil_image))
    labels = {}
    for item in raw:
        canonical = _canonical_image_label(item.get("label"))
        labels[canonical] = float(item.get("score", 0.0))

    nsfw_score = labels.get("nsfw", 0.0)
    top_label = max(labels, key=labels.get) if labels else "normal"

    return {
        "model": IMAGE_MODEL_ID,
        "labels": labels,
        "top_label": top_label,
        "violation_score": round(nsfw_score, 6),
    }
