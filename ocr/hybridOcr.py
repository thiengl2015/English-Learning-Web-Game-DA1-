"""
hybridOcr.py — Hybrid OCR pipeline cho IELTS Reading
==================================================

Kết hợp:
- PaddleOCR: Fast text extraction với bounding boxes
- TableTransformer: Deep table parsing
- pdfplumber: Layout preservation fallback
- PyMuPDF: Diagram extraction

Output structure:
{
  "success": bool,
  "strategy": str,  # "paddle" | "pdfplumber" | "fitz"
  "pages": [{
    "pageIndex": int,
    "text": str,           # Combined text (OCR + tables)
    "rawText": str,        # Raw PaddleOCR text (if available)
    "textBlocks": [{        # Structured blocks from PaddleOCR
      "text": str,
      "bbox": [x0,y0,x1,y1],
      "type": str,         # "title" | "text" | "question" | "answer"
      "confidence": float
    }],
    "tables": [{
      "bbox": [x0,y0,x1,y1],
      "cells": [[str]],    # 2D array
      "html": str,
      "isComplex": bool    # Has merged cells
    }],
    "diagramCrops": [str],  # Base64 images
    "metadata": {
      "isScanned": bool,
      "ocrRecommended": bool,
      "textDensity": int,
      "language": str,     # "en" | "vi" | "mixed"
      "hasTables": bool,
      "hasDiagrams": bool,
      "extractionMethod": str
    }
  }],
  "errors": [str],
  "stats": {
    "totalPages": int,
    "totalTables": int,
    "totalDiagramCrops": int,
    "avgConfidence": float,
    "processingTimeMs": int
  }
}

Usage:
    python hybridOcr.py <pdf_path> [--lang=en] [--tables] [--diagrams]
"""

import sys
import json
import base64
import traceback
import time
import warnings
from pathlib import Path
warnings.filterwarnings('ignore')

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

CONFIG = {
    "paddle": {
        "lang": "en",  # en, vietnamese, ch, japan, korean
        "use_angle_cls": True,
        "det_limit_side_len": 1920,  # Max image dimension for detection
        "det_db_thresh": 0.3,        # Detection threshold
        "det_db_box_thresh": 0.5,    # Box threshold
        "show_log": False,
    },
    "table_transformer": {
        "model_path": None,  # Auto-download if None
        "cpu_workers": 4,
    },
    "diagram": {
        "min_size": 100,           # Min pixels for diagram
        "page_coverage": 0.03,     # Min % of page
        "max_pixels": 2_000_000,  # Max crop pixels
        "dpi": 150,
    },
    "scanned": {
        "text_density_threshold": 100,   # Below this = likely scanned
        "page_coverage_threshold": 0.05, # Below this = scanned
    }
}


# ═══════════════════════════════════════════════════════════════════════════════
# PADDLEOCR EXTRACTION
# ═══════════════════════════════════════════════════════════════════════════════

def init_paddleocr(lang="en"):
    """Initialize PaddleOCR với retry logic."""
    try:
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(
            lang=lang,
            use_angle_cls=CONFIG["paddle"]["use_angle_cls"],
            show_log=CONFIG["paddle"]["show_log"],
            det_limit_side_len=CONFIG["paddle"]["det_limit_side_len"],
            det_db_thresh=CONFIG["paddle"]["det_db_thresh"],
            det_db_box_thresh=CONFIG["paddle"]["det_db_box_thresh"],
        )
        return ocr
    except ImportError:
        print("[hybridOcr] PaddleOCR not installed. Run: pip install paddlepaddle paddleocr", flush=True)
        return None
    except Exception as e:
        print(f"[hybridOcr] PaddleOCR init failed: {e}", flush=True)
        return None


def classify_text_block(text, bbox, page_height):
    """Classify text block type dựa trên position và content."""
    x0, y0, x1, y1 = bbox
    page_y_ratio = y0 / page_height if page_height > 0 else 0
    text_lower = text.lower().strip()
    
    # Header detection
    if page_y_ratio < 0.15:
        if any(k in text_lower for k in ['reading', 'passage', 'section', 'question']):
            return "title"
        return "header"
    
    # Footer detection
    if page_y_ratio > 0.85:
        return "footer"
    
    # Question pattern: starts with number followed by dot/paren
    import re
    if re.match(r'^\s*\d+\s*[.)]?\s*', text) and len(text) < 500:
        # Check if it looks like a question
        if '?' in text or text_lower.startswith(('choose', 'which', 'what', 'how', 'why', 'where', 'who')):
            return "question"
        # Or numbered statement (likely TFNG)
        if any(k in text_lower for k in ['true', 'false', 'not given', 'yes', 'no']):
            return "question"
        if re.search(r'\d+\s*[.)]\s*[A-D]', text):
            return "question"
    
    # Answer options (A, B, C, D lines)
    if re.match(r'^\s*[A-Da-d]\s*[.)]\s*', text):
        return "answer_option"
    
    # Short lines in column might be table headers
    if len(text) < 50 and page_y_ratio > 0.15 and page_y_ratio < 0.85:
        return "short_text"
    
    return "text"


def detect_language(ocr_result):
    """Detect primary language từ OCR results."""
    try:
        from paddleocr import PaddleOCR
        # Simple heuristic: check for Vietnamese diacritics
        vietnamese_chars = 0
        total_chars = 0
        
        for line in ocr_result[0] if ocr_result else []:
            text = line[1][0] if line else ""
            for c in text:
                if ord(c) > 127:  # Non-ASCII
                    total_chars += 1
                    if c in 'ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽẽếềểễểệỉịọỏốồổỗộớờởỡợụủứừửữựỵỷỹ':
                        vietnamese_chars += 1
                else:
                    total_chars += 1
        
        if total_chars > 0:
            vi_ratio = vietnamese_chars / total_chars
            if vi_ratio > 0.1:
                return "vietnamese"
            elif vi_ratio > 0.02:
                return "mixed"
        return "en"
    except:
        return "en"


def extract_with_paddleocr(ocr, pdf_page_image, page_height, page_idx):
    """
    Extract structured text blocks using PaddleOCR.
    Returns: {textBlocks, tables, combinedText, metadata}
    """
    try:
        import numpy as np
        from PIL import Image
        import io
        
        # Convert PIL Image to numpy if needed
        if isinstance(pdf_page_image, Image.Image):
            img_array = np.array(pdf_page_image)
        else:
            img_array = pdf_page_image
        
        # PaddleOCR inference
        start_time = time.time()
        result = ocr.ocr(img_array, cls=True)
        ocr_time = time.time() - start_time
        
        if not result or not result[0]:
            return {
                "textBlocks": [],
                "tables": [],
                "combinedText": "",
                "metadata": {
                    "confidence": 0,
                    "ocrTime": ocr_time,
                    "language": "unknown"
                }
            }
        
        text_blocks = []
        total_confidence = 0
        text_count = 0
        
        for line in result[0]:
            if not line:
                continue
            
            bbox = [int(x) for x in line[0]]  # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            text = line[1][0]
            confidence = float(line[1][1])
            
            # Flatten bbox to [x0,y0,x1,y1]
            flat_bbox = [
                min(p[0] for p in bbox),
                min(p[1] for p in bbox),
                max(p[0] for p in bbox),
                max(p[1] for p in bbox)
            ]
            
            block_type = classify_text_block(text, flat_bbox, page_height)
            
            text_blocks.append({
                "text": text,
                "bbox": flat_bbox,
                "type": block_type,
                "confidence": confidence
            })
            
            total_confidence += confidence
            text_count += 1
        
        # Detect language
        language = detect_language(result)
        
        # Sort by reading order (top-to-bottom, left-to-right)
        text_blocks.sort(key=lambda b: (round(b["bbox"][1] / 10) * 10, b["bbox"][0]))
        
        # Combine text maintaining structure
        combined_text = reconstruct_reading_order(text_blocks)
        
        return {
            "textBlocks": text_blocks,
            "tables": [],  # Tables handled separately
            "combinedText": combined_text,
            "metadata": {
                "confidence": total_confidence / text_count if text_count > 0 else 0,
                "ocrTime": ocr_time,
                "language": language,
                "blockCount": text_count
            }
        }
    except Exception as e:
        print(f"[hybridOcr] PaddleOCR failed for page {page_idx}: {e}", flush=True)
        return {
            "textBlocks": [],
            "tables": [],
            "combinedText": "",
            "metadata": {
                "confidence": 0,
                "error": str(e)
            }
        }


def reconstruct_reading_order(blocks):
    """Reconstruct text from sorted blocks with proper spacing."""
    if not blocks:
        return ""
    
    lines = []
    current_y_group = None
    line_texts = []
    
    for block in blocks:
        bbox = block["bbox"]
        y_group = round(bbox[1] / 15) * 15  # Group by ~15px rows
        
        # Check if new line
        if current_y_group is not None and abs(y_group - current_y_group) > 20:
            if line_texts:
                lines.append(" ".join(line_texts))
            line_texts = []
        
        # Add appropriate spacing based on x position
        if line_texts and bbox[0] - (block.get("_last_x", 0)) > 50:
            line_texts.append("    ")  # Indentation for columns
        
        line_texts.append(block["text"])
        block["_last_x"] = bbox[2]
        current_y_group = y_group
    
    if line_texts:
        lines.append(" ".join(line_texts))
    
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# TABLE TRANSFORMER
# ═══════════════════════════════════════════════════════════════════════════════

def init_table_transformer():
    """Initialize TableTransformer model."""
    try:
        from transformers import AutoProcessor, RTDetrForObjectDetection
        import torch
        
        # Use table-transformer model
        model_name = "microsoft/table-transformer-detection"
        
        processor = AutoProcessor.from_pretrained(model_name)
        model = RTDetrForObjectDetection.from_pretrained(model_name)
        
        if torch.cuda.is_available():
            model = model.to("cuda")
        
        return {"processor": processor, "model": model}
    except ImportError:
        print("[hybridOcr] transformers not installed. Run: pip install transformers torch", flush=True)
        return None
    except Exception as e:
        print(f"[hybridOcr] TableTransformer init failed: {e}", flush=True)
        return None


def detect_tables_with_transformer(tt_model, image, threshold=0.5):
    """Detect table regions using TableTransformer."""
    try:
        import torch
        from PIL import Image
        import numpy as np
        
        if isinstance(image, Image.Image):
            img = image
        else:
            img = Image.fromarray(image)
        
        inputs = tt_model["processor"](images=img, return_tensors="pt")
        
        if torch.cuda.is_available():
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = tt_model["model"](**inputs)
        
        # Parse results
        target_sizes = torch.tensor([img.size[::-1]])
        results = tt_model["processor"].post_process_object_detection(
            outputs, target_sizes=target_sizes, threshold=threshold
        )[0]
        
        tables = []
        for score, label, box in zip(results["scores"], results["labels"], results["boxes"]):
            if label == 1:  # table label
                tables.append({
                    "bbox": [int(x) for x in box.tolist()],
                    "confidence": float(score)
                })
        
        return tables
    except Exception as e:
        print(f"[hybridOcr] Table detection failed: {e}", flush=True)
        return []


def parse_table_cells(table_bbox, image, paddle_result=None):
    """
    Parse table cells within bounding box.
    Uses pdfplumber-style extraction for structured tables.
    """
    try:
        import pdfplumber
        import fitz
        # For now, return placeholder - actual cell parsing would need
        # a dedicated table structure recognition model
        return {
            "bbox": table_bbox,
            "cells": [],
            "html": "",
            "isComplex": False
        }
    except:
        return {
            "bbox": table_bbox,
            "cells": [],
            "html": "",
            "isComplex": False
        }


# ═══════════════════════════════════════════════════════════════════════════════
# PDF PROCESSING
# ═══════════════════════════════════════════════════════════════════════════════

def pdf_page_to_image(pdf_path, page_idx, dpi=150):
    """Convert PDF page to image using PyMuPDF."""
    try:
        import fitz
        doc = fitz.open(pdf_path)
        page = doc[page_idx]
        
        # Calculate scale for target DPI
        scale = dpi / 72
        mat = fitz.Matrix(scale, scale)
        
        # Render to pixmap
        pixmap = page.get_pixmap(matrix=mat, alpha=False)
        img_data = pixmap.tobytes("png")
        
        from PIL import Image
        import io
        
        img = Image.open(io.BytesIO(img_data))
        doc.close()
        
        return img, page.rect.height
    except Exception as e:
        print(f"[hybridOcr] PDF render failed: {e}", flush=True)
        return None, 0


def extract_diagram_regions(pdf_path, page_idx, fitz_page, page_height):
    """Extract diagram/image regions from PDF page."""
    try:
        import fitz
        import base64
        import math
        
        page = fitz_page
        page_w = page.rect.width
        page_h = page.rect.height
        crops = []
        
        # Get images
        image_list = page.get_images(full=True)
        
        for img_info in image_list:
            try:
                xref = img_info[0]
                base_image = page.parent.extract_image(xref)
                img_bbox = page.get_image_rects(xref)
                
                if not img_bbox:
                    continue
                    
                bbox = img_bbox[0]
                w = bbox.width
                h = bbox.height
                
                # Filter by size
                if w < CONFIG["diagram"]["min_size"] or h < CONFIG["diagram"]["min_size"]:
                    continue
                    
                # Filter by page coverage
                coverage = (w * h) / (page_w * page_h)
                if coverage < CONFIG["diagram"]["page_coverage"]:
                    continue
                
                # Filter footer images
                if bbox.y0 > page_h * 0.88:
                    continue
                
                # Crop with padding
                pad = 15
                clip = fitz.Rect(
                    max(0, bbox.x0 - pad),
                    max(0, bbox.y0 - pad),
                    min(page_w, bbox.x1 + pad),
                    min(page_h, bbox.y1 + pad)
                )
                
                # Calculate scale to stay under max pixels
                est_w = clip.width * (CONFIG["diagram"]["dpi"] / 72)
                est_h = clip.height * (CONFIG["diagram"]["dpi"] / 72)
                total_pixels = est_w * est_h
                
                scale = CONFIG["diagram"]["dpi"] / 72
                if total_pixels > CONFIG["diagram"]["max_pixels"]:
                    scale *= math.sqrt(CONFIG["diagram"]["max_pixels"] / total_pixels)
                
                pixmap = page.get_pixmap(
                    matrix=fitz.Matrix(scale, scale),
                    clip=clip,
                    colorspace=fitz.csRGB
                )
                
                b64 = base64.b64encode(pixmap.tobytes("png")).decode("utf-8")
                crops.append(b64)
                
            except Exception as e:
                continue
        
        return crops
    except Exception as e:
        print(f"[hybridOcr] Diagram extraction failed: {e}", flush=True)
        return []


# ═══════════════════════════════════════════════════════════════════════════════
# FALLBACK EXTRACTORS
# ═══════════════════════════════════════════════════════════════════════════════

def extract_with_pdfplumber(pdf_path, page_idx):
    """Fallback: extract text using pdfplumber."""
    try:
        import pdfplumber
        from pdfplumber.utils import get_bbox_overlap
        
        pages_data = []
        
        with pdfplumber.open(pdf_path) as pdf:
            if page_idx >= len(pdf.pages):
                return {"text": "", "tables": [], "metadata": {}}
            
            page = pdf.pages[page_idx]
            
            # Extract text
            text = page.extract_text(layout=True) or ""
            
            # Extract tables
            tables = page.extract_tables()
            table_data = []
            for t in tables or []:
                if t:
                    table_data.append({
                        "cells": t,
                        "html": table_to_html(t)
                    })
            
            # Metadata
            raw_text = text or ""
            text_density = len(raw_text.strip())
            page_area = (page.width or 595) * (page.height or 792)
            is_scanned = text_density < CONFIG["scanned"]["text_density_threshold"] and text_density < page_area * CONFIG["scanned"]["page_coverage_threshold"]
            
            return {
                "text": text,
                "tables": table_data,
                "metadata": {
                    "isScanned": is_scanned,
                    "textDensity": text_density,
                    "isMultiColumn": False,
                    "extractionMethod": "pdfplumber"
                }
            }
    except Exception as e:
        print(f"[hybridOcr] pdfplumber failed: {e}", flush=True)
        return {"text": "", "tables": [], "metadata": {}}


def extract_with_fitz(pdf_path, page_idx):
    """Fallback: extract text using PyMuPDF."""
    try:
        import fitz
        
        doc = fitz.open(pdf_path)
        page = doc[page_idx]
        
        # Extract text with blocks
        text = page.get_text("text") or ""
        
        # Detect if scanned
        text_density = len(text.strip())
        page_area = page.rect.width * page.rect.height
        is_scanned = text_density < CONFIG["scanned"]["text_density_threshold"] and text_density < page_area * CONFIG["scanned"]["page_coverage_threshold"]
        
        doc.close()
        
        return {
            "text": text,
            "metadata": {
                "isScanned": is_scanned,
                "textDensity": text_density,
                "extractionMethod": "fitz"
            }
        }
    except Exception as e:
        print(f"[hybridOcr] fitz failed: {e}", flush=True)
        return {"text": "", "metadata": {}}


def table_to_html(table):
    """Convert table cells to HTML."""
    if not table:
        return ""
    
    rows_html = []
    for row in table:
        cells = [f"<td>{str(c or '').strip()}</td>" for c in row]
        rows_html.append(f"<tr>{''.join(cells)}</tr>")
    
    return f"<table>{''.join(rows_html)}</table>"


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN EXTRACTION PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def extract_pdf_hybrid(pdf_path, lang="en", use_paddle=True, use_table_transformer=False):
    """
    Main hybrid extraction pipeline.
    
    Flow:
    1. Try PaddleOCR (if use_paddle=True and available)
    2. If Paddle fails or low confidence, try pdfplumber
    3. Final fallback: fitz
    4. Extract diagrams from all methods
    """
    start_time = time.time()
    errors = []
    
    # Initialize OCR engines
    paddle_ocr = None
    if use_paddle:
        print("[hybridOcr] Initializing PaddleOCR...", flush=True)
        paddle_ocr = init_paddleocr(lang)
        if paddle_ocr:
            print("[hybridOcr] PaddleOCR initialized successfully", flush=True)
    
    # table_transformer = None
    # if use_table_transformer:
    #     table_transformer = init_table_transformer()
    
    pages_data = []
    total_tables = 0
    total_crops = 0
    all_confidences = []
    
    try:
        import fitz
        doc = fitz.open(pdf_path)
        num_pages = len(doc)
        
        for page_idx in range(num_pages):
            print(f"[hybridOcr] Processing page {page_idx + 1}/{num_pages}...", flush=True)
            
            page_result = {
                "pageIndex": page_idx,
                "text": "",
                "rawText": "",
                "textBlocks": [],
                "tables": [],
                "diagramCrops": [],
                "metadata": {
                    "isScanned": False,
                    "ocrRecommended": False,
                    "textDensity": 0,
                    "language": "en",
                    "hasTables": False,
                    "hasDiagrams": False,
                    "extractionMethod": "none"
                }
            }
            
            try:
                # ═══ Step 1: Try PaddleOCR ═══
                if paddle_ocr:
                    # Convert page to image
                    img, page_height = pdf_page_to_image(pdf_path, page_idx, dpi=150)
                    
                    if img:
                        paddle_result = extract_with_paddleocr(
                            paddle_ocr, img, page_height, page_idx
                        )
                        
                        if paddle_result["textBlocks"]:
                            page_result["textBlocks"] = paddle_result["textBlocks"]
                            page_result["combinedText"] = paddle_result["combinedText"]
                            page_result["metadata"]["extractionMethod"] = "paddle"
                            page_result["metadata"]["confidence"] = paddle_result["metadata"].get("confidence", 0)
                            page_result["metadata"]["language"] = paddle_result["metadata"].get("language", "en")
                            
                            if "blockCount" in paddle_result["metadata"]:
                                page_result["metadata"]["textDensity"] = paddle_result["metadata"]["blockCount"]
                            
                            # Check if OCR recommended
                            avg_confidence = paddle_result["metadata"].get("confidence", 0)
                            if avg_confidence < 0.7 or len(paddle_result["textBlocks"]) < 5:
                                page_result["metadata"]["ocrRecommended"] = True
                            
                            all_confidences.append(avg_confidence)
                            print(f"[hybridOcr] Page {page_idx}: PaddleOCR OK ({len(paddle_result['textBlocks'])} blocks, conf={avg_confidence:.2f})", flush=True)
                        else:
                            print(f"[hybridOcr] Page {page_idx}: PaddleOCR returned no blocks, falling back", flush=True)
                            errors.append(f"Page {page_idx}: PaddleOCR no results")
                
                # ═══ Step 2: Fallback to pdfplumber if Paddle failed ═══
                if not page_result["textBlocks"]:
                    plumber_result = extract_with_pdfplumber(pdf_path, page_idx)
                    if plumber_result["text"]:
                        page_result["text"] = plumber_result["text"]
                        page_result["metadata"].update(plumber_result["metadata"])
                        page_result["metadata"]["extractionMethod"] = "pdfplumber"
                        
                        if plumber_result["tables"]:
                            page_result["tables"] = plumber_result["tables"]
                            page_result["metadata"]["hasTables"] = True
                            total_tables += len(plumber_result["tables"])
                        
                        print(f"[hybridOcr] Page {page_idx}: pdfplumber OK ({len(page_result['text'])} chars)", flush=True)
                    else:
                        # ═══ Step 3: Final fallback to fitz ═══
                        fitz_result = extract_with_fitz(pdf_path, page_idx)
                        if fitz_result["text"]:
                            page_result["text"] = fitz_result["text"]
                            page_result["metadata"].update(fitz_result["metadata"])
                            page_result["metadata"]["extractionMethod"] = "fitz"
                            print(f"[hybridOcr] Page {page_idx}: fitz fallback OK ({len(page_result['text'])} chars)", flush=True)
                
                # ═══ Step 4: Extract diagrams ═══
                fitz_page = doc[page_idx]
                diagrams = extract_diagram_regions(pdf_path, page_idx, fitz_page, fitz_page.rect.height)
                
                if diagrams:
                    page_result["diagramCrops"] = diagrams
                    page_result["metadata"]["hasDiagrams"] = True
                    total_crops += len(diagrams)
                
                # Determine if scanned
                if page_result["metadata"]["textDensity"] < CONFIG["scanned"]["text_density_threshold"]:
                    page_result["metadata"]["isScanned"] = True
                    page_result["metadata"]["ocrRecommended"] = True
                
                pages_data.append(page_result)
                
            except Exception as page_err:
                errors.append(f"Page {page_idx}: {str(page_err)}")
                print(f"[hybridOcr] Page {page_idx} error: {page_err}", flush=True)
                pages_data.append({
                    "pageIndex": page_idx,
                    "text": "",
                    "error": str(page_err)
                })
        
        doc.close()
        
    except Exception as e:
        errors.append(f"PDF open: {str(e)}")
        print(f"[hybridOcr] PDF error: {e}", flush=True)
    
    processing_time = int((time.time() - start_time) * 1000)
    
    return {
        "success": len(pages_data) > 0 and any(p.get("text") or p.get("textBlocks") for p in pages_data),
        "strategy": "hybrid",
        "pages": pages_data,
        "errors": errors,
        "stats": {
            "totalPages": len(pages_data),
            "totalTables": total_tables,
            "totalDiagramCrops": total_crops,
            "avgConfidence": sum(all_confidences) / len(all_confidences) if all_confidences else 0,
            "processingTimeMs": processing_time
        }
    }


# ═══════════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Hybrid OCR for IELTS Reading PDFs")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("--lang", default="en", choices=["en", "vietnamese", "ch", "mixed"],
                        help="OCR language (default: en)")
    parser.add_argument("--no-paddle", action="store_true", help="Skip PaddleOCR")
    parser.add_argument("--use-tables", action="store_true", help="Enable TableTransformer")
    
    args = parser.parse_args()
    
    if not Path(args.pdf_path).exists():
        print(json.dumps({
            "success": False,
            "errors": [f"File not found: {args.pdf_path}"]
        }))
        sys.exit(1)
    
    result = extract_pdf_hybrid(
        args.pdf_path,
        lang=args.lang,
        use_paddle=not args.no_paddle,
        use_table_transformer=args.use_tables
    )
    
    print(json.dumps(result, ensure_ascii=False))
