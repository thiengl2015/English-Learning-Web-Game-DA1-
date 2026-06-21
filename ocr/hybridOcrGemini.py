"""
hybridOcrGemini.py — Hybrid OCR: PaddleOCR + Gemini Flash 3.5
============================================================

Flow:
1. Try PaddleOCR first (fast, free, local)
2. If fails OR low confidence → Use Gemini
3. Return combined results

Usage:
    python hybridOcrGemini.py document.pdf [--api-key=KEY]

Environment:
    GEMINI_API_KEY - Gemini API key (if not passed as argument)
"""

import sys
import json
import os
import io
import base64
import time
import traceback
import warnings
from pathlib import Path
from PIL import Image

warnings.filterwarnings('ignore')

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

CONFIG = {
    "paddle": {
        "lang": "en",
        "use_angle_cls": True,
        "det_limit_side_len": 1920,
        "det_db_thresh": 0.3,
        "det_db_box_thresh": 0.5,
        "show_log": False,
    },
    "gemini": {
        "model": "gemini-2.0-flash",
        "confidence_threshold": 0.7,  # Below this → use Gemini
        "min_block_count": 5,       # Below this → use Gemini
        "timeout": 30,
    },
    "scanned": {
        "text_density_threshold": 100,
        "page_coverage_threshold": 0.05,
    }
}


# ═══════════════════════════════════════════════════════════════════════════════
# PADDLEOCR ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class PaddleEngine:
    """Wrapper for PaddleOCR operations."""
    
    def __init__(self, lang="en"):
        self.ocr = None
        self.lang = lang
        self._init_ocr()
    
    def _init_ocr(self):
        try:
            from paddleocr import PaddleOCR
            self.ocr = PaddleOCR(
                lang='en',
                use_angle_cls=True,
                det_limit_side_len=CONFIG["paddle"]["det_limit_side_len"],
                det_db_thresh=CONFIG["paddle"]["det_db_thresh"],
                det_db_box_thresh=CONFIG["paddle"]["det_db_box_thresh"],
            )
            print("[hybridOcr] PaddleOCR initialized", flush=True)
        except ImportError:
            print("[hybridOcr] PaddleOCR not installed", flush=True)
            self.ocr = None
        except Exception as e:
            print(f"[hybridOcr] PaddleOCR init failed: {e}", flush=True)
            self.ocr = None
    
    def is_available(self):
        return self.ocr is not None
    
    def extract(self, img_array):
        """Extract text blocks from image."""
        if not self.ocr:
            return None
        
        try:
            result = self.ocr.ocr(img_array)
            if not result or not result[0]:
                return None
            return result[0]
        except Exception as e:
            print(f"[hybridOcr] PaddleOCR failed: {e}", flush=True)
            return None
    
    def get_confidence(self, result):
        """Calculate average confidence from OCR result."""
        if not result:
            return 0
        confidences = []
        for line in result:
            if line and len(line) >= 2:
                conf = float(line[1][1]) if isinstance(line[1], tuple) else 0
                confidences.append(conf)
        return sum(confidences) / len(confidences) if confidences else 0


# ═══════════════════════════════════════════════════════════════════════════════
# GEMINI ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class GeminiEngine:
    """Wrapper for Gemini Flash 3.5 OCR operations."""
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.model = None
        self._init_gemini()
    
    def _init_gemini(self):
        try:
            import google.generativeai as genai
            if not self.api_key:
                print("[hybridOcr] GEMINI_API_KEY not set", flush=True)
                self.model = None
                return
            
            genai.configure(api_key=self.api_key)
            import google.generativeai as genai
            self.model = genai.GenerativeModel('gemini-2.5-flash')
            print("[hybridOcr] Gemini Flash 3.5 initialized", flush=True)
        except ImportError:
            print("[hybridOcr] google-generativeai not installed", flush=True)
            self.model = None
        except Exception as e:
            print(f"[hybridOcr] Gemini init failed: {e}", flush=True)
            self.model = None
    
    def is_available(self):
        return self.model is not None
    
    def extract(self, image, prompt=None):
        """Extract text from image using Gemini."""
        if not self.model:
            return None
        
        try:
            # Ensure we have a PIL Image
            if isinstance(image, Image.Image):
                pil_image = image
            else:
                pil_image = Image.open(image)
            
            # Default prompt
            if prompt is None:
                prompt = """Extract ALL text from this document image.
                Preserve reading order (top to bottom, left to right).
                Keep paragraph structure.
                For tables, use tab characters between columns.
                Return ONLY the extracted text, no explanations."""
            
            from google.generativeai.types import content_types
            blob = content_types.image_to_blob(pil_image)
            
            response = self.model.generate_content(
                [prompt, blob]
            )
            
            return response.text
            
        except Exception as e:
            print(f"[hybridOcr] Gemini extraction failed: {e}", flush=True)
            return None


# ═══════════════════════════════════════════════════════════════════════════════
# HYBRID OCR ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class HybridOCR:
    """Hybrid OCR combining PaddleOCR and Gemini."""
    
    def __init__(self, gemini_api_key=None):
        self.paddle = PaddleEngine()
        self.gemini = GeminiEngine(api_key=gemini_api_key)
        
        print(f"[hybridOcr] PaddleOCR: {'[OK]' if self.paddle.is_available() else '[X]'}")
        print(f"[hybridOcr] Gemini:    {'[OK]' if self.gemini.is_available() else '[X]'}")
    
    def _page_to_image(self, pdf_path, page_idx, dpi=150):
        """Convert PDF page to PIL Image."""
        import fitz
        doc = fitz.open(pdf_path)
        page = doc[page_idx]
        
        scale = dpi / 72
        mat = fitz.Matrix(scale, scale)
        pixmap = page.get_pixmap(matrix=mat, alpha=False)
        
        img = Image.open(io.BytesIO(pixmap.tobytes("png")))
        doc.close()
        return img
    
    def _should_use_gemini(self, paddle_result, page_text=""):
        """Decide if Gemini fallback is needed."""
        # No PaddleOCR available
        if not self.paddle.is_available():
            return True
        
        # Paddle returned nothing
        if not paddle_result or len(paddle_result) == 0:
            return True
        
        # Low confidence
        confidence = self.paddle.get_confidence(paddle_result)
        if confidence < CONFIG["gemini"]["confidence_threshold"]:
            return True
        
        # Too few blocks detected
        if len(paddle_result) < CONFIG["gemini"]["min_block_count"]:
            return True
        
        # Check text density (scanned detection)
        text_density = len(page_text.strip())
        if text_density < CONFIG["scanned"]["text_density_threshold"]:
            return True
        
        return False
    
    def _paddle_result_to_text(self, result, page_height):
        """Convert PaddleOCR result to structured text."""
        if not result:
            return ""
        
        blocks = []
        for line in result:
            if not line:
                continue
            
            bbox = [int(x) for x in line[0]]
            text = line[1][0]
            confidence = float(line[1][1])
            
            blocks.append({
                "text": text,
                "bbox": bbox,
                "confidence": confidence,
                "y_group": round(min(p[1] for p in bbox) / 15) * 15
            })
        
        # Sort by reading order
        blocks.sort(key=lambda b: (b["y_group"], b["bbox"][0]))
        
        # Reconstruct text
        lines = []
        current_y = None
        line_texts = []
        
        for block in blocks:
            y = block["y_group"]
            
            if current_y is not None and abs(y - current_y) > 20:
                if line_texts:
                    lines.append(" ".join(line_texts))
                line_texts = []
            
            # Check for column separation
            if line_texts and block["bbox"][0] - (blocks[blocks.index(block)-1]["bbox"][2] if blocks.index(block) > 0 else 0) > 50:
                line_texts.append("    ")
            
            line_texts.append(block["text"])
            current_y = y
        
        if line_texts:
            lines.append(" ".join(line_texts))
        
        return "\n".join(lines)
    
    def _extract_page(self, pdf_path, page_idx):
        """Extract text from a single page using hybrid approach."""
        page_result = {
            "pageIndex": page_idx,
            "text": "",
            "extractionMethod": None,
            "confidence": 0,
            "geminiUsed": False,
            "metadata": {}
        }
        
        try:
            # Convert page to image
            img = self._page_to_image(pdf_path, page_idx)
            img_array = img
            page_height = img.height
            
            # ═══ Step 1: Try PaddleOCR ═══
            paddle_result = None
            if self.paddle.is_available():
                paddle_result = self.paddle.extract(img_array)
                page_text = self._paddle_result_to_text(paddle_result, page_height)
                
                # Check if Gemini fallback needed
                if self._should_use_gemini(paddle_result, page_text):
                    print(f"[hybridOcr] Page {page_idx}: PaddleOCR insufficient, trying Gemini...", flush=True)
                    page_result["geminiUsed"] = True
                else:
                    # Success with PaddleOCR
                    page_result["text"] = page_text
                    page_result["extractionMethod"] = "paddle"
                    page_result["confidence"] = self.paddle.get_confidence(paddle_result)
                    return page_result
            
            # ═══ Step 2: Use Gemini ═══
            if page_result["geminiUsed"] or not self.paddle.is_available():
                if self.gemini.is_available():
                    gemini_text = self.gemini.extract(img)
                    if gemini_text:
                        page_result["text"] = gemini_text
                        page_result["extractionMethod"] = "gemini"
                        page_result["confidence"] = 1.0  # Gemini doesn't give confidence
                    else:
                        # Gemini also failed, try Paddle text if available
                        if paddle_result:
                            page_result["text"] = self._paddle_result_to_text(paddle_result, page_height)
                            page_result["extractionMethod"] = "paddle-fallback"
                            page_result["confidence"] = self.paddle.get_confidence(paddle_result)
                else:
                    # No Gemini, use Paddle if available
                    if paddle_result:
                        page_result["text"] = self._paddle_result_to_text(paddle_result, page_height)
                        page_result["extractionMethod"] = "paddle-fallback"
                        page_result["confidence"] = self.paddle.get_confidence(paddle_result)
            
        except Exception as e:
            page_result["error"] = str(e)
            print(f"[hybridOcr] Page {page_idx} error: {e}", flush=True)
        
        return page_result
    
    def _wrap_result(self, pages_data, gemini_count):
        """Wrap result into standard JSON format."""
        return {
            "success": True,
            "pages": pages_data,
            "errors": [],
            "stats": {
                "totalPages": len(pages_data),
                "geminiPages": gemini_count,
                "paddlePages": len(pages_data) - gemini_count,
                "geminiFallbackRate": f"{gemini_count / len(pages_data) * 100:.1f}%" if pages_data else "0%"
            }
        }
    
    def process_image(self, image_path):
        """Process a single image file (JPG, PNG, etc.)"""
        errors = []
        
        try:
            img = Image.open(image_path).convert('RGB')
        except Exception as e:
            return {
                "success": False,
                "pages": [],
                "errors": [str(e)],
                "stats": {"totalPages": 0, "geminiPages": 0, "paddlePages": 0, "geminiFallbackRate": "0%"}
            }
        
        import numpy as np
        img_array = np.array(img)
        page_height = img.height
        
        page_result = {
            "pageIndex": 0,
            "text": "",
            "extractionMethod": None,
            "confidence": 0,
            "geminiUsed": False,
            "metadata": {}
        }
        
        print(f"[hybridOcr] Processing 1 pages...", flush=True)
        
        # Step 1: Try PaddleOCR
        paddle_result = None
        if self.paddle.is_available():
            paddle_result = self.paddle.extract(img_array)  # numpy array
            page_text = self._paddle_result_to_text(paddle_result, page_height)
            
            if self._should_use_gemini(paddle_result, page_text):
                print(f"[hybridOcr] Page 0: PaddleOCR insufficient, trying Gemini...", flush=True)
                page_result["geminiUsed"] = True
            else:
                page_result["text"] = page_text
                page_result["extractionMethod"] = "paddle"
                page_result["confidence"] = self.paddle.get_confidence(paddle_result)
                print(f"[hybridOcr] Page 1: paddle ({len(page_text)} chars)", flush=True)
                return self._wrap_result([page_result], 0)
        
        # Step 2: Gemini fallback
        if page_result["geminiUsed"] or not self.paddle.is_available():
            if self.gemini.is_available():
                gemini_text = self.gemini.extract(img)  # PIL Image direct
                if gemini_text:
                    page_result["text"] = gemini_text
                    page_result["extractionMethod"] = "gemini"
                    page_result["confidence"] = 1.0
                elif paddle_result:
                    page_result["text"] = self._paddle_result_to_text(paddle_result, page_height)
                    page_result["extractionMethod"] = "paddle-fallback"
                    page_result["confidence"] = self.paddle.get_confidence(paddle_result)
            elif paddle_result:
                page_result["text"] = self._paddle_result_to_text(paddle_result, page_height)
                page_result["extractionMethod"] = "paddle-fallback"
                page_result["confidence"] = self.paddle.get_confidence(paddle_result)
        
        gemini_count = 1 if page_result["geminiUsed"] else 0
        print(f"[hybridOcr] Page 1: {page_result['extractionMethod']} ({len(page_result['text'])} chars)", flush=True)
        return self._wrap_result([page_result], gemini_count)
    
    def process_pdf(self, pdf_path, start_page=0, end_page=None):
        """Process entire PDF using hybrid OCR."""
        import fitz
        
        errors = []
        pages_data = []
        gemini_count = 0
        
        doc = fitz.open(pdf_path)
        total_pages = len(doc)
        end_page = end_page or total_pages
        
        print(f"[hybridOcr] Processing {total_pages} pages...", flush=True)
        
        for page_idx in range(start_page, min(end_page, total_pages)):
            result = self._extract_page(pdf_path, page_idx)
            pages_data.append(result)
            
            method = result.get("extractionMethod", "failed")
            gemini_used = result.get("geminiUsed", False)
            
            if gemini_used:
                gemini_count += 1
            
            text_len = len(result.get("text", ""))
            print(f"[hybridOcr] Page {page_idx + 1}: {method} ({text_len} chars)", flush=True)
        
        doc.close()
        
        return {
            "success": len(pages_data) > 0,
            "pages": pages_data,
            "errors": errors,
            "stats": {
                "totalPages": len(pages_data),
                "geminiPages": gemini_count,
                "paddlePages": len(pages_data) - gemini_count,
                "geminiFallbackRate": f"{gemini_count / len(pages_data) * 100:.1f}%" if pages_data else "0%"
            }
        }


# ═══════════════════════════════════════════════════════════════════════════════
# CLI ENTRY POINT
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Hybrid OCR: PaddleOCR + Gemini Flash 3.5")
    parser.add_argument('pdf_path', help="Path to PDF file")
    parser.add_argument('--api-key', help="Gemini API key (or set GEMINI_API_KEY env)")
    parser.add_argument('--pages', help="Page range (e.g., 0-5)")
    parser.add_argument('--skip-gemini', action='store_true', help="Only use PaddleOCR")
    
    args = parser.parse_args()
    
    if not Path(args.pdf_path).exists():
        print(json.dumps({"success": False, "errors": ["File not found"]}))
        sys.exit(1)
    
    # Process page range
    start_page = 0
    end_page = None
    if args.pages:
        try:
            parts = args.pages.split('-')
            start_page = int(parts[0])
            end_page = int(parts[1]) if len(parts) > 1 else None
        except:
            pass
    
    # Create hybrid OCR
    ocr = HybridOCR(gemini_api_key=args.api_key)
    
    # Detect file type
    file_ext = Path(args.pdf_path).suffix.lower()
    IMAGE_EXTS = {'.jpg', '.jpeg', '.jfif', '.png', '.bmp', '.tiff', '.tif', '.webp'}

    print(f"[DEBUG-PY] file path: {args.pdf_path}", flush=True)
    print(f"[DEBUG-PY] file_ext: '{file_ext}'", flush=True)
    print(f"[DEBUG-PY] is image: {file_ext in IMAGE_EXTS}", flush=True)

    if file_ext in IMAGE_EXTS:
        # Process image file
        result = ocr.process_image(args.pdf_path)
    else:
        # Process PDF file
        result = ocr.process_pdf(
            args.pdf_path,
            start_page=start_page,
            end_page=end_page
        )
    
    # Print stats
    print(f"\n[hybridOcr] Summary:", flush=True)
    print(f"  - Total pages: {result['stats']['totalPages']}", flush=True)
    print(f"  - PaddleOCR: {result['stats']['paddlePages']}", flush=True)
    print(f"  - Gemini fallback: {result['stats']['geminiPages']}", flush=True)
    print(f"  - Fallback rate: {result['stats']['geminiFallbackRate']}", flush=True)
    
    # Output JSON
    print(json.dumps(result, ensure_ascii=False))
