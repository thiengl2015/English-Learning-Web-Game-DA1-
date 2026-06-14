import sys
import json
import traceback
import warnings
warnings.filterwarnings('ignore')


def _table_to_text(table):
    """
    Convert a single pdfplumber table (list of list of str)
    into a readable multi-line string.
    """
    if not table:
        return ''
    
    lines = []
    for row in table:
        if not row:
            continue
        cells = [str(cell).strip() if cell else '' for cell in row]
        # Join cells with tab (keeps column structure readable)
        lines.append('\t'.join(cells))
    
    return '\n'.join(lines)


def _detect_tables_from_text(plumber_page):
    """
    Detect tables based on text patterns when pdfplumber fails.
    Looks for column-aligned text blocks that form table-like structures.
    Returns list of table info dicts.
    """
    try:
        import re
    except ImportError:
        return []

    detected_tables = []
    page_w = plumber_page.width or 595
    page_h = plumber_page.height or 792

    try:
        text = plumber_page.extract_text() or ""
    except:
        return []

    # Patterns that suggest a table-like structure
    table_indicators = [
        r'(?:Tour|Activity|Holiday|Consultation|Session|Course|Item|Product|Service)\s+.*(?:Details|Cost|Price|Fee|Schedule|Time)',
        r'(?:Name|Address|Phone|Email|Date|Time|Type|Category|Status|Amount|Total)\s+\|\s*',
        r'={3,}',  # Separator lines
        r'-{3,}',
        r'\+\-{2,}\+',  # ASCII table borders
    ]

    has_table_indicator = any(re.search(p, text, re.IGNORECASE) for p in table_indicators)

    if has_table_indicator:
        # Try to extract table structure using tab characters or aligned spaces
        lines = text.split('\n')
        table_rows = []

        for line in lines:
            # Lines with tabs suggest table data
            if '\t' in line:
                parts = line.split('\t')
                if len(parts) >= 2:
                    table_rows.append(parts)
            # Lines with aligned spaces (common in PDF tables)
            elif re.match(r'^\s*\S+\s{4,}\S', line):
                # Try to split by 4+ spaces (column separator)
                parts = re.split(r'\s{4,}', line.strip())
                if len(parts) >= 2:
                    table_rows.append(parts)

        if len(table_rows) >= 2:
            # Estimate bounding box based on text positions
            # For simplicity, we'll mark the page as having a table
            detected_tables.append({
                "bbox": [50, 100, page_w - 50, page_h * 0.7],
                "row_count": len(table_rows),
                "col_count": max(len(r) for r in table_rows) if table_rows else 0,
                "type": "detected_from_text"
            })

    return detected_tables


def _table_rows_to_text(tables):
    """
    Convert pdfplumber extract_tables output (list of tables)
    into a readable multi-line string.
    """
    if not tables:
        return ''
    
    all_tables_text = []
    for table in tables:
        txt = _table_to_text(table)
        if txt:
            all_tables_text.append(txt)
            
    return '\n\n---\n\n'.join(all_tables_text)


def _is_bold_font(fontname):
    """Return True if fontname indicates bold weight."""
    if not fontname:
        return False
    fn = fontname.lower()
    return any(x in fn for x in ['bold', 'black', 'heavy', 'semibold', 'medium'])


def _normalize_text(text):
    """Normalize text for semantic comparison (deduplication)."""
    if not text:
        return ""
    import re
    # Lowercase, remove non-alphanumeric (except spaces), collapse whitespace
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def _is_near(b1, b2, threshold=35, padding=12):
    """Check if two bboxes are near each other using expansion and center distance."""
    x0_1, y0_1, x1_1, y1_1 = b1
    x0_2, y0_2, x1_2, y1_2 = b2
    
    # 1. Check expanded overlap
    if not (x1_1 + padding < x0_2 or x1_2 + padding < x0_1 or 
            y1_1 + padding < y0_2 or y1_2 + padding < y0_1):
        return True
        
    # 2. Check center distance
    c1 = ((x0_1 + x1_1) / 2, (y0_1 + y1_1) / 2)
    c2 = ((x0_2 + x1_2) / 2, (y0_2 + y1_2) / 2)
    dist = ((c1[0] - c2[0])**2 + (c1[1] - c2[1])**2)**0.5
    return dist < threshold


def cluster_bboxes(bboxes_with_data, distance=35, padding=12):
    """
    Cluster bboxes with proximity and expansion. 
    bboxes_with_data is a list of tuples: (bbox, type, data)
    where bbox is (x0, y0, x1, y1)
    """
    if not bboxes_with_data:
        return []
        
    clusters = []
    for item in bboxes_with_data:
        bbox = item[0]
        found_cluster = False
        for cluster in clusters:
            if any(_is_near(bbox, c_item[0], distance, padding) for c_item in cluster):
                cluster.append(item)
                found_cluster = True
                break
        if not found_cluster:
            clusters.append([item])
            
    # Merge clusters that might now be connected
    changed = True
    while changed:
        changed = False
        new_clusters = []
        while clusters:
            current = clusters.pop(0)
            merged = False
            for i, other in enumerate(new_clusters):
                if any(any(_is_near(c1[0], c2[0], distance, padding) for c2 in other) for c1 in current):
                    new_clusters[i].extend(current)
                    merged = True
                    changed = True
                    break
            if not merged:
                new_clusters.append(current)
        clusters = new_clusters
        
    return clusters


def _score_cluster(cluster_items, is_map_heuristic=False):
    """
    Calculate a score for a cluster to decide if it's a real diagram.
    cluster_items: list of (bbox, type, data)
    is_map_heuristic: if True, lower threshold for map-like content
    """
    score = 0
    counts = {"image": 0, "rect": 0, "line": 0, "curve": 0}
    
    for bbox, dtype, data in cluster_items:
        counts[dtype] += 1
        area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
        
        # Score each element type
        if dtype == "image":
            score += 10
        elif dtype == "curve":
            score += 5
        elif dtype == "rect":
            score += 1
            # Bonus for larger rects (map boundaries, building shapes)
            if area > 5000:
                score += 2
        elif dtype == "line":
            score += 0.5
        
        # Penalties for forms/tables (thin lines without rects/images)
        if counts["image"] == 0 and counts["curve"] == 0:
            if counts["line"] > 0 and counts["line"] < 10:
                score -= 5
                # But maps can have many thin lines (grid, roads, borders)
                if is_map_heuristic and counts["rect"] >= 2:
                    score += 5  # Restore score for map-like content
            
    return score, counts


def _get_table_density(table):
    """Measure how 'full' a table is (non-empty cells / total cells)."""
    if not table or not table[0]:
        return 0
    rows = len(table)
    cols = len(table[0])
    total_cells = rows * cols
    if total_cells == 0: return 0
    
    filled_cells = sum(1 for row in table for cell in row if cell and str(cell).strip())
    return filled_cells / total_cells


def _detect_repeated_artifacts(fitz_doc):
    """Scan all pages to find lines appearing on >60% of pages at the same y-position."""
    line_counts = {}
    num_pages = len(fitz_doc)
    if num_pages < 3:
        return set()
        
    for page in fitz_doc:
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            if b['type'] != 0: continue
            for line in b["lines"]:
                # Use normalized text and rounded y-position for counting
                txt = "".join(s["text"] for s in line["spans"]).strip()
                if not txt: continue
                # Round y to nearest 2 pts to handle slight variations
                y_pos = round(line["bbox"][1] / 2) * 2
                key = (txt, y_pos)
                line_counts[key] = line_counts.get(key, 0) + 1
                
    threshold = num_pages * 0.6
    artifacts = {key for key, count in line_counts.items() if count >= threshold}
    return artifacts


def _extract_text_with_fitz(fitz_page, artifacts=None, plumber_tables=None):
    """
    Extract text using fitz blocks with:
    - Spacing preservation (joining spans)
    - Bold detection (flags + fontname)
    - Header/Footer artifact removal
    - Multi-column aware sorting
    - TABLE INTERLEAVING (Bug 1 Fix)
    """
    if artifacts is None:
        artifacts = set()
    if plumber_tables is None:
        plumber_tables = []
        
    try:
        blocks = fitz_page.get_text("dict")["blocks"]
        
        # 1. Convert plumber tables into blocks
        table_blocks = []
        for pt in plumber_tables:
            # pt is a pdfplumber Table object
            bbox = pt.bbox # (x0, top, x1, bottom)
            table_text = _table_to_text(pt.extract())
            if table_text.strip():
                table_blocks.append({
                    "type": 1, # mark as non-text block
                    "bbox": bbox,
                    "is_table": True,
                    "text": f"\n[TABLE_START]\n{table_text}\n[TABLE_END]\n"
                })

        # 2. Filter artifacts and overlapping table text from blocks
        cleaned_blocks = []
        for b in blocks:
            if b['type'] != 0: continue
            
            # Skip if block overlaps significantly with any table
            is_in_table = False
            for tb in table_blocks:
                if _bbox_overlap_ratio(tb['bbox'], b['bbox']) > 0.5:
                    is_in_table = True
                    break
            if is_in_table:
                continue

            new_lines = []
            for line in b["lines"]:
                txt = "".join(s["text"] for s in line["spans"]).strip()
                y_pos = round(line["bbox"][1] / 2) * 2
                if (txt, y_pos) in artifacts:
                    continue
                new_lines.append(line)
            if new_lines:
                b["lines"] = new_lines
                cleaned_blocks.append(b)
        
        # Combine all blocks
        all_blocks = cleaned_blocks + table_blocks

        if not all_blocks:
            return ""

        # Column Detection: find clear x-gutters
        page_rect = fitz_page.rect
        mid_x = page_rect.width / 2
        left_blocks = [b for b in all_blocks if b['bbox'][2] <= mid_x + 20]
        right_blocks = [b for b in all_blocks if b['bbox'][0] >= mid_x - 20]
        
        is_multi_column = len(left_blocks) > 4 and len(right_blocks) > 4 and (len(left_blocks) + len(right_blocks)) > len(all_blocks) * 0.7
        
        if is_multi_column:
            left_blocks.sort(key=lambda b: (round(b['bbox'][1] / 5) * 5, b['bbox'][0]))
            right_blocks.sort(key=lambda b: (round(b['bbox'][1] / 5) * 5, b['bbox'][0]))
            other_blocks = [b for b in all_blocks if b not in left_blocks and b not in right_blocks]
            other_blocks.sort(key=lambda b: (round(b['bbox'][1] / 5) * 5, b['bbox'][0]))
            
            headers = [b for b in other_blocks if b['bbox'][1] < page_rect.height * 0.2]
            footers = [b for b in other_blocks if b['bbox'][1] > page_rect.height * 0.8]
            mid_full = [b for b in other_blocks if b not in headers and b not in footers]
            
            sorted_blocks = headers + mid_full + left_blocks + right_blocks + footers
        else:
            sorted_blocks = all_blocks
            sorted_blocks.sort(key=lambda b: (round(b['bbox'][1] / 5) * 5, b['bbox'][0]))

        text_blocks = []
        for b in sorted_blocks:
            if b.get("is_table"):
                text_blocks.append(b["text"])
                continue

            block_lines = []
            for line in b["lines"]:
                line_parts = []
                for span in line["spans"]:
                    txt = span["text"]
                    font = span.get("font", "")
                    flags = span.get("flags", 0)
                    is_bold = bool(flags & 2) or _is_bold_font(font)
                    
                    if is_bold and txt.strip():
                        leading_spaces = len(txt) - len(txt.lstrip())
                        trailing_spaces = len(txt) - len(txt.rstrip())
                        content = txt.strip()
                        if content:
                            part = (" " * leading_spaces) + f"**{content}**" + (" " * trailing_spaces)
                            line_parts.append(part)
                        else:
                            line_parts.append(txt)
                    else:
                        line_parts.append(txt)
                
                line_text = "".join(line_parts)
                if line_text.strip():
                    block_lines.append(line_text)
            
            if block_lines:
                text_blocks.append("\n".join(block_lines))

        return "\n\n".join(text_blocks)
    except Exception as e:
        print(f"[pythonPdfExtractor] fitz extraction error: {e}", flush=True)
        return ""


def _bbox_overlap_ratio(img_bbox, text_bbox):
    """
    Calculate what fraction of img_bbox is overlapped by text_bbox.
    Returns a value in [0, 1].
    """
    ix0, iy0, ix1, iy1 = img_bbox
    tx0, ty0, tx1, ty1 = text_bbox

    inter_x0 = max(ix0, tx0)
    inter_y0 = max(iy0, ty0)
    inter_x1 = min(ix1, tx1)
    inter_y1 = min(iy1, ty1)

    if inter_x1 <= inter_x0 or inter_y1 <= inter_y0:
        return 0.0

    inter_area = (inter_x1 - inter_x0) * (inter_y1 - inter_y0)
    img_area = max((ix1 - ix0) * (iy1 - iy0), 1)
    text_area = max((tx1 - tx0) * (ty1 - ty0), 1)
    return inter_area / min(img_area, text_area)


def _is_watermark_by_text_overlap(img_bbox, plumber_page, fitz_page, overlap_threshold=0.25, is_map_content=False):
    """
    Return True if the image is likely a watermark/background based on
    how much of its area is covered by text blocks.

    Logic: a real diagram rarely has significant text drawn ON TOP of it
    (text is usually beside or below). A watermark/background image, by
    contrast, typically has lots of page text sitting over it.

    CRITICAL: For map images, text labels ARE expected to be on top of the map
    (e.g., "15 the bathrooms" on an IELTS map). These are NOT watermarks.
    Set is_map_content=True to skip watermark detection for maps.

    Parameters
    ----------
    img_bbox         : (x0, top, x1, bottom) in pdfplumber coordinates
    plumber_page     : pdfplumber Page object
    fitz_page        : fitz Page object (used for high-fidelity text blocks)
    overlap_threshold: fraction of image area that must be covered by text
                       to classify as watermark (default 0.25 = 25%)
    is_map_content   : if True, skip watermark detection (maps have text labels)
    """
    # Maps are expected to have text labels - don't treat as watermark
    if is_map_content:
        return False

    try:
        # Collect text bboxes from fitz (more reliable positions than pdfplumber)
        blocks = fitz_page.get_text("dict").get("blocks", [])
        text_bboxes = []
        for b in blocks:
            if b.get("type") != 0:
                continue
            bx0, by0, bx1, by1 = b["bbox"]
            # fitz uses (x0, y0, x1, y1) — same coordinate space as pdfplumber x0/top
            text_bboxes.append((bx0, by0, bx1, by1))

        if not text_bboxes:
            return False

        # Sum up how much of the image bbox is covered by text bboxes
        # (approximate: sum individual overlaps, capped at 1.0)
        total_overlap = 0.0
        for tb in text_bboxes:
            total_overlap += _bbox_overlap_ratio(img_bbox, tb)
            if total_overlap >= overlap_threshold:
                return True  # early exit

        return False
    except Exception:
        return False


def extract_vector_diagram_regions(plumber_page, fitz_page):
    """
    Detect vector-drawn diagrams like flowcharts and maps.
    These are made of shapes (rects, lines, curves) without embedded images.
    Returns list of dict with {bbox, image_base64, type}.
    """
    try:
        import fitz, base64, math
    except ImportError:
        return []

    diagram_images = []
    page_w = plumber_page.width or 595
    page_h = plumber_page.height or 792
    max_pixels = 2_000_000
    pad = 20

    # Collect vector elements
    rects = []
    for element in getattr(plumber_page, 'rects', []) or []:
        try:
            bbox = (element.get('x0', 0), element.get('top', 0), element.get('x1', 0), element.get('bottom', 0))
            width = bbox[2] - bbox[0]
            height = bbox[3] - bbox[1]
            if width > 5 and height > 5:
                rects.append((bbox, "rect", element))
        except Exception: continue

    lines = []
    for element in getattr(plumber_page, 'lines', []) or []:
        try:
            bbox = (element.get('x0', 0), element.get('top', 0), element.get('x1', 0), element.get('bottom', 0))
            width = abs(bbox[2] - bbox[0])
            height = abs(bbox[3] - bbox[1])
            if width > 5 or height > 5:
                lines.append((bbox, "line", element))
        except Exception: continue

    curves = []
    for curve in getattr(plumber_page, 'curves', []) or []:
        try:
            pts = curve.get('pts', [])
            if len(pts) >= 2:
                xs, ys = [p[0] for p in pts], [p[1] for p in pts]
                bbox = (min(xs), min(ys), max(xs), max(ys))
                lines_count = len(pts) - 1
                if bbox[2] > bbox[0] and bbox[3] > bbox[1]:
                    curves.append((bbox, "curve", curve, lines_count))
        except Exception: continue

    # Detect FLOWCHART pattern: multiple rects (boxes) with connecting lines
    is_flowchart = len(rects) >= 2 and len(lines) >= 1
    is_map = (len(rects) >= 4 and len(lines) >= 2) or (len(rects) >= 3 and len(curves) >= 1)

    if is_flowchart or is_map:
        # Calculate combined bounding box
        all_bboxes = [r[0] for r in rects] + [l[0] for l in lines] + [c[0] for c in curves]
        if all_bboxes:
            c_x0 = max(0.0, min(b[0] for b in all_bboxes) - pad)
            c_y0 = max(0.0, min(b[1] for b in all_bboxes) - pad)
            c_x1 = min(page_w, max(b[2] for b in all_bboxes) + pad)
            c_y1 = min(page_h, max(b[3] for b in all_bboxes) + pad)

            if c_x1 > c_x0 and c_y1 > c_y0:
                try:
                    clip = fitz.Rect(c_x0, c_y0, c_x1, c_y1)
                    scale = 150 / 72

                    est_w = (c_x1 - c_x0) * scale
                    est_h = (c_y1 - c_y0) * scale
                    total_pixels = est_w * est_h

                    if total_pixels > max_pixels:
                        scale *= math.sqrt(max_pixels / total_pixels)

                    pixmap = fitz_page.get_pixmap(
                        matrix=fitz.Matrix(scale, scale),
                        clip=clip,
                        colorspace=fitz.csRGB
                    )
                    b64 = base64.b64encode(pixmap.tobytes('png')).decode('utf-8')

                    diagram_type = "flowchart" if is_flowchart else "map"
                    diagram_images.append({
                        "bbox": [float(c_x0), float(c_y0), float(c_x1), float(c_y1)],
                        "image": b64,
                        "type": diagram_type,
                        "rect_count": len(rects),
                        "line_count": len(lines),
                        "curve_count": len(curves)
                    })
                except Exception as e:
                    print(f'[pythonPdfExtractor] vector diagram crop error: {e}', flush=True)

    return diagram_images


def _detect_map_heuristic(plumber_page):
    """
    Detect if a page likely contains map-like content based on text patterns.
    Returns True if map-related keywords are found near visual elements.
    """
    try:
        import re
        page_text = plumber_page.extract_text() or ""
        map_keywords = [
            r'\bmap\b', r'\bmaps\b', r'\bplan\b', r'\bareal\b',
            r'\bnorth\b', r'\bsouth\b', r'\beast\b', r'\bwest\b',
            r'\bfloor\b', r'\blevel\b', r'\bground\b',
            r'\bfigure\s*\d+\b', r'\bdiagram\s*\d+\b',
            r'\blook at\b', r'\blabel\b', r'\bcomplete\b',
            r'\bcity\b', r'\bbuildings?\b', r'\broad\b', r'\bstreet\b',
            r'\bstation\b', r'\bairport\b', r'\bterminal\b',
            r'\bregion\b', r'\bzone\b', r'\barea\b',
            r'\bn\s*e\s*s\s*w\b', r'\bcompass\b',
        ]
        pattern = re.compile('|'.join(map_keywords), re.IGNORECASE)
        return pattern.search(page_text) is not None
    except:
        return False


def extract_diagram_regions(plumber_page, fitz_page):
    """
    Extract diagram/image regions using PyMuPDF native detection + per-document watermark deduplication.
    
    Strategy:
    1. Collect candidates: embedded images (via get_image_rects) + colored filled rects (via get_drawings)
    2. Identify watermark xrefs: images appearing on multiple pages
    3. Per page: filter candidates, cluster nearby ones, crop unique regions
    4. Fallback to pixel scanning if no candidates found
    
    Returns list of base64 PNG crops.
    """
    import fitz, base64, math, re, sys
    
    crops = []
    page_w = plumber_page.width or 595
    page_h = plumber_page.height or 792
    page_area = page_w * page_h
    MAX_PIXELS = 2_000_000
    
    # Get page text for visual keywords
    try:
        page_text = plumber_page.extract_text() or ""
    except:
        page_text = ""
    
    visual_keywords = [
        r'complete the table', r'complete the flow[- ]?chart',
        r'complete the form', r'complete the notes',
        r'plan below', r'map below', r'diagram below',
        r'fill in the', r'look at the', r'choose two',
    ]
    
    has_visual = any(re.search(p, page_text, re.I) for p in visual_keywords)
    if not has_visual:
        return []
    
    # === STEP 1: Collect embedded image candidates via PyMuPDF ===
    page_rect = fitz_page.rect
    pw, ph = page_rect.width, page_rect.height
    
    # Get watermark xrefs set by document-level pre-scan
    watermark_xrefs = getattr(sys.modules[__name__], '_doc_watermark_xrefs', set())
    xref_page_count = getattr(sys.modules[__name__], '_doc_xref_pages', {})
    
    # Collect all images on this page
    img_candidates = []
    try:
        for img_info in fitz_page.get_images(full=True):
            xref = img_info[0]
            
            try:
                # Get rect for this image on this page
                img_rects = fitz_page.get_image_rects(xref)
                if not img_rects:
                    continue
                
                r = img_rects[0]
                w = r.width
                h = r.height
                
                # Filter: too small (icon)
                if w < 80 or h < 80:
                    continue
                
                # Filter: footer
                if r.y0 > ph * 0.88:
                    continue
                
                # Filter: covers entire page (background)
                coverage = (w * h) / (pw * ph)
                if coverage > 0.85:
                    continue
                
                # Check if this xref appears on many pages (watermark)
                is_watermark = xref in watermark_xrefs
                
                img_candidates.append({
                    'type': 'image',
                    'xref': xref,
                    'rect': r,
                    'w': w, 'h': h,
                    'coverage': coverage,
                    'is_watermark': is_watermark,
                })
            except Exception:
                continue
    except Exception:
        pass
    
    # === STEP 2: Collect table borders from drawings (line segments + filled rects) ===
    draw_candidates = []
    
    # Separate lines (for table border detection) from filled rects
    vertical_lines = []  # (x, y_start, y_end)
    horizontal_lines = []  # (y, x_start, x_end)
    filled_rects = []  # actual filled rectangles
    
    try:
        for d in fitz_page.get_drawings():
            try:
                r = d.get('rect')
                if not r:
                    continue
                
                fill = d.get('fill')
                color = d.get('color')
                width = d.get('width', 0)
                
                w = r.width
                h = r.height
                
                # Type 1: Filled rectangles (colored, not white)
                if fill:
                    if isinstance(fill, (list, tuple)) and len(fill) >= 3:
                        fr, fg, fb = fill[0], fill[1], fill[2]
                        # Colored fill (not white)
                        if not (fr > 0.9 and fg > 0.9 and fb > 0.9):
                            if w >= 50 and h >= 50:  # Only substantial filled rects
                                filled_rects.append(r)
                            continue
                
                # Type 2: Line strokes (table borders)
                if color and width > 0.5:
                    if isinstance(color, (list, tuple)) and len(color) >= 3:
                        cr, cg, cb = color[0], color[1], color[2]
                        # Dark stroke (black or dark gray)
                        if not (cr > 0.7 and cg > 0.7 and cb > 0.7):
                            x0, y0, x1, y1 = r.x0, r.y0, r.x1, r.y1
                            
                            # Vertical line: w ~ 0, h significant
                            if w < 5 and h > 50:
                                vertical_lines.append((x0, y0, y1))
                            # Horizontal line: h ~ 0, w significant
                            elif h < 5 and w > 50:
                                horizontal_lines.append((y0, x0, x1))
            except Exception:
                continue
    except Exception:
        pass
    
    # Build table bounding boxes from line clusters
    table_regions = []
    
    if vertical_lines and horizontal_lines:
        # Find table regions by intersecting lines
        # Group vertical lines by x position
        v_lines_sorted = sorted(vertical_lines, key=lambda x: x[0])
        
        # Group horizontal lines by y position
        h_lines_sorted = sorted(horizontal_lines, key=lambda x: x[0])
        
        # Find bounding boxes
        for i, (vx, vy0, vy1) in enumerate(v_lines_sorted):
            for j, (hx, hx0, hx1) in enumerate(h_lines_sorted):
                for k, (vx2, vy02, vy12) in enumerate(v_lines_sorted[i+1:], i+1):
                    # Find horizontal lines between vy0 and vy1
                    for m, (hy, hx02, hx12) in enumerate(h_lines_sorted):
                        if hy > vy0 and hy < vy1 and hx02 < vx and hx12 > vx2:
                            # Found a table cell - expand to full bounding box
                            # Top line: first horizontal line above
                            top_y = min(hy for hy, _, _ in h_lines_sorted if hy >= vy0 - 5)
                            # Bottom line: last horizontal line below
                            bottom_y = max(hy for hy, _, _ in h_lines_sorted if hy <= vy1 + 5)
                            # Left/right: vertical lines
                            left_x = vx
                            right_x = vx2
                            
                            # Create bounding box with padding
                            table_regions.append(fitz.Rect(left_x - 5, top_y - 5, right_x + 5, bottom_y + 5))
    
    # Add filled rectangles
    for r in filled_rects:
        if r.y0 < ph * 0.88:  # Skip footer
            draw_candidates.append({
                'type': 'draw',
                'rect': r,
                'w': r.width, 'h': r.height,
                'coverage': (r.width * r.height) / (pw * ph),
            })
    
    # Add table regions from line clusters
    for tr in table_regions:
        if tr.y0 < ph * 0.88 and tr.width > 100 and tr.height > 80:
            draw_candidates.append({
                'type': 'table_from_lines',
                'rect': tr,
                'w': tr.width, 'h': tr.height,
                'coverage': (tr.width * tr.height) / (pw * ph),
            })
    
    # === STEP 3: Combine and cluster candidates ===
    all_candidates = []
    
    # Add non-watermark images
    for c in img_candidates:
        if not c['is_watermark']:
            all_candidates.append(c)
    
    # Add colored filled rects
    all_candidates.extend(draw_candidates)
    
    if not all_candidates:
        # === FALLBACK: pixel scanning ===
        return _extract_diagram_regions_pixel(plumber_page, fitz_page)
    
    # Cluster nearby candidates (overlap or within margin)
    margin = 20  # pt
    clusters = []
    
    for cand in all_candidates:
        r = cand['rect']
        placed = False
        for cluster in clusters:
            cr = cluster['rect']
            # Check if overlapping or within margin
            ox = min(r.x1, cr.x1) - max(r.x0, cr.x0)
            oy = min(r.y1, cr.y1) - max(r.y0, cr.y0)
            if ox + margin > 0 and oy + margin > 0:
                # Merge bounds
                cluster['rect'] = fitz.Rect(
                    min(r.x0, cr.x0), min(r.y0, cr.y0),
                    max(r.x1, cr.x1), max(r.y1, cr.y1)
                )
                cluster['count'] += 1
                placed = True
                break
        if not placed:
            clusters.append({
                'rect': fitz.Rect(r.x0, r.y0, r.x1, r.y1),
                'count': 1,
                'type': cand['type'],
            })
    
    # Deduplicate: keep larger cluster when overlapping significantly
    final_regions = []
    for cluster in clusters:
        if cluster['count'] < 1:
            continue
        
        r = cluster['rect']
        w = r.width
        h = r.height
        
        # Skip tiny regions
        if w < 60 or h < 50:
            continue
        
        is_dup = False
        for i, fr in enumerate(final_regions):
            ox = min(r.x1, fr.x1) - max(r.x0, fr.x0)
            oy = min(r.y1, fr.y1) - max(r.y0, fr.y0)
            if ox > 30 and oy > 20:
                # Significant overlap — keep larger
                area_new = w * h
                area_old = fr.width * fr.height
                if area_new > area_old:
                    final_regions[i] = r
                is_dup = True
                break
        
        if not is_dup:
            final_regions.append(r)
    
    # === STEP 4: Crop each region ===
    for r in final_regions:
        try:
            # Add small padding
            pad = 8
            c_x0 = max(0, r.x0 - pad)
            c_y0 = max(0, r.y0 - pad)
            c_x1 = min(page_w, r.x1 + pad)
            c_y1 = min(page_h, r.y1 + pad)
            
            # Skip if too small after padding
            if c_x1 - c_x0 < 60 or c_y1 - c_y0 < 50:
                continue
            
            final_scale = 150 / 72
            est_w = (c_x1 - c_x0) * final_scale
            est_h = (c_y1 - c_y0) * final_scale
            
            if est_w * est_h > MAX_PIXELS:
                final_scale *= math.sqrt(MAX_PIXELS / (est_w * est_h))
            
            clip = fitz.Rect(c_x0, c_y0, c_x1, c_y1)
            cropped = fitz_page.get_pixmap(
                matrix=fitz.Matrix(final_scale, final_scale),
                clip=clip,
                colorspace=fitz.csRGB
            )
            b64 = base64.b64encode(cropped.tobytes('png')).decode('utf-8')
            crops.append(b64)
        except Exception:
            continue
    
    return crops


def _extract_diagram_regions_pixel(plumber_page, fitz_page):
    """
    Fallback pixel scanning when no candidates found via PyMuPDF detection.
    Used for PDFs where content is embedded as background images without xref/drawing metadata.
    """
    import fitz, base64, math, re
    
    try:
        import numpy as np
    except ImportError:
        return []
    
    crops = []
    page_w = plumber_page.width or 595
    page_h = plumber_page.height or 792
    MAX_PIXELS = 2_000_000
    
    try:
        page_text = plumber_page.extract_text() or ""
    except:
        page_text = ""
    
    visual_keywords = [
        r'complete the table', r'complete the flow[- ]?chart',
        r'complete the form', r'complete the notes',
        r'plan below', r'map below', r'diagram below',
        r'fill in the', r'look at the', r'choose two',
    ]
    
    has_visual = any(re.search(p, page_text, re.I) for p in visual_keywords)
    if not has_visual:
        return []
    
    # Render page
    scale = 2.0
    pixmap = fitz_page.get_pixmap(
        matrix=fitz.Matrix(scale, scale),
        colorspace=fitz.csRGB
    )
    
    samples = pixmap.samples
    img_height = pixmap.height
    img_width = pixmap.width
    n_channels = pixmap.n
    
    if n_channels == 1:
        gray = np.frombuffer(samples, np.uint8).reshape(img_height, img_width)
        colored_img = None
    elif n_channels == 3:
        img = np.frombuffer(samples, np.uint8).reshape(img_height, img_width, 3)
        gray = np.dot(img, [0.299, 0.587, 0.114]).astype(np.uint8)
        colored_img = img
    else:
        img = np.frombuffer(samples, np.uint8).reshape(img_height, img_width, n_channels)
        gray = np.dot(img[..., :3], [0.299, 0.587, 0.114]).astype(np.uint8)
        colored_img = img
    
    pdf_to_px_y = img_height / page_h
    pdf_to_px_x = img_width / page_w
    
    # Method 1: Colored regions (maps)
    colored_regions = []
    
    if colored_img is not None:
        r_ch = colored_img[:, :, 0]
        g_ch = colored_img[:, :, 1]
        b_ch = colored_img[:, :, 2]
        
        non_white = (r_ch < 220) | (g_ch < 220) | (b_ch < 220)
        row_colored = np.sum(non_white, axis=1)
        colored_threshold = img_width * 0.05
        
        in_colored = row_colored > colored_threshold
        
        colored_row_regions = []
        start = None
        min_height = int(50 * pdf_to_px_y)
        
        for y in range(img_height):
            if in_colored[y]:
                if start is None:
                    start = y
            else:
                if start is not None:
                    if y - start >= min_height:
                        colored_row_regions.append((start, y))
                    start = None
        
        if start is not None and img_height - start >= min_height:
            colored_row_regions.append((start, img_height))
        
        for y0, y1 in colored_row_regions:
            row_pixels = non_white[y0:y1, :]
            
            left_x = 0
            for x in range(img_width):
                if np.sum(row_pixels[:, x]) > (y1 - y0) * 0.1:
                    left_x = x
                    break
            
            right_x = img_width
            for x in range(img_width - 1, -1, -1):
                if np.sum(row_pixels[:, x]) > (y1 - y0) * 0.1:
                    right_x = x + 1
                    break
            
            pdf_y0 = y0 / pdf_to_px_y
            pdf_y1 = y1 / pdf_to_px_y
            pdf_x0 = left_x / pdf_to_px_x
            pdf_x1 = right_x / pdf_to_px_x
            
            if pdf_y0 < page_h * 0.88:
                colored_regions.append((pdf_x0, pdf_y0, pdf_x1, pdf_y1))
    
    # Method 2: Dark border detection
    dark_threshold = 60
    
    dark_rows = []
    for y in range(img_height):
        dark_count = np.sum(gray[y, :] < dark_threshold)
        if dark_count > 400:
            dark_rows.append(('thick', y))
        elif dark_count > 200:
            dark_rows.append(('thin', y))
    
    h_borders = []
    if dark_rows:
        start_y = dark_rows[0][1]
        prev_y = dark_rows[0][1]
        border_type = dark_rows[0][0]
        
        for i in range(1, len(dark_rows)):
            bt = dark_rows[i][0]
            yi = dark_rows[i][1]
            if bt == border_type and yi - prev_y <= 5:
                prev_y = yi
            else:
                if prev_y - start_y >= 2:
                    h_borders.append((border_type, start_y, prev_y))
                start_y = yi
                prev_y = yi
                border_type = bt
        
        if prev_y - start_y >= 2:
            h_borders.append((border_type, start_y, prev_y))
    
    v_borders = []
    for x in range(img_width):
        dark_count = np.sum(gray[:, x] < dark_threshold)
        if dark_count > 300:
            v_borders.append(('thick', x))
        elif dark_count > 150:
            v_borders.append(('thin', x))
    
    v_border_groups = []
    if v_borders:
        start_x = v_borders[0][1]
        prev_x = v_borders[0][1]
        border_type = v_borders[0][0]
        
        for i in range(1, len(v_borders)):
            bt = v_borders[i][0]
            xi = v_borders[i][1]
            if bt == border_type and xi - prev_x <= 5:
                prev_x = xi
            else:
                if prev_x - start_x >= 2:
                    v_border_groups.append((border_type, start_x, prev_x))
                start_x = xi
                prev_x = xi
                border_type = bt
        
        if prev_x - start_x >= 2:
            v_border_groups.append((border_type, start_x, prev_x))
    
    # Find bordered regions
    diagram_regions = list(colored_regions)
    
    min_region_h = int(80 * pdf_to_px_y)
    min_region_w = int(100 * pdf_to_px_x)
    
    for h_idx, (ht, h1s, h1e) in enumerate(h_borders):
        for h2t, h2s, h2e in h_borders[h_idx+1:]:
            if h2t != ht:
                continue
            rh = h2s - h1e
            if rh < min_region_h:
                continue
            
            for v_idx, (vt, v1s, v1e) in enumerate(v_border_groups):
                for v2t, v2s, v2e in v_border_groups[v_idx+1:]:
                    if v2t != vt:
                        continue
                    rw = v2s - v1e
                    if rw < min_region_w:
                        continue
                    
                    v1_ok = v1s < h2s and v1e > h1e
                    v2_ok = v2s < h2s and v2e > h1e
                    
                    if v1_ok and v2_ok:
                        pdf_x0 = v1e / pdf_to_px_x
                        pdf_y0 = h1e / pdf_to_px_y
                        pdf_x1 = v2s / pdf_to_px_x
                        pdf_y1 = h2s / pdf_to_px_y
                        
                        if pdf_y0 < page_h * 0.88:
                            diagram_regions.append((pdf_x0, pdf_y0, pdf_x1, pdf_y1))
    
    # Deduplicate
    final_regions = []
    for region in diagram_regions:
        is_dup = False
        for i, r in enumerate(final_regions):
            ox = min(region[2], r[2]) - max(region[0], r[0])
            oy = min(region[3], r[3]) - max(region[1], r[1])
            if ox > 50 and oy > 30:
                area1 = (region[2] - region[0]) * (region[3] - region[1])
                area2 = (r[2] - r[0]) * (r[3] - r[1])
                if area1 > area2:
                    final_regions[i] = region
                is_dup = True
                break
        if not is_dup:
            final_regions.append(region)
    
    # Crop
    for pdf_x0, pdf_y0, pdf_x1, pdf_y1 in final_regions:
        try:
            w = pdf_x1 - pdf_x0
            h = pdf_y1 - pdf_y0
            if w < 50 or h < 40:
                continue
            
            pad = 5
            c_x0 = max(0, pdf_x0 - pad)
            c_y0 = max(0, pdf_y0 - pad)
            c_x1 = min(page_w, pdf_x1 + pad)
            c_y1 = min(page_h, pdf_y1 + pad)
            
            final_scale = 150 / 72
            est_w = (c_x1 - c_x0) * final_scale
            est_h = (c_y1 - c_y0) * final_scale
            
            if est_w * est_h > MAX_PIXELS:
                final_scale *= math.sqrt(MAX_PIXELS / (est_w * est_h))
            
            clip = fitz.Rect(c_x0, c_y0, c_x1, c_y1)
            cropped = fitz_page.get_pixmap(
                matrix=fitz.Matrix(final_scale, final_scale),
                clip=clip,
                colorspace=fitz.csRGB
            )
            b64 = base64.b64encode(cropped.tobytes('png')).decode('utf-8')
            crops.append(b64)
        except Exception:
            continue
    
    return crops


def _extract_diagram_from_images(plumber_page, fitz_page):
    """
    Fallback: Extract diagrams by analyzing images detected by pdfplumber.
    Returns list of base64-encoded PNG images.
    """
    import fitz, base64, math
    
    crops = []
    page_w = plumber_page.width or 595
    page_h = plumber_page.height or 792
    page_area = page_w * page_h
    MAX_PIXELS = 2_000_000
    
    for img in plumber_page.images:
        try:
            bbox = (img.get('x0', 0), img.get('top', 0), img.get('x1', 0), img.get('bottom', 0))
            x0, y0, x1, y1 = bbox
            w = x1 - x0
            h = y1 - y0
            
            if w < 60 or h < 40:
                continue
            
            if y0 > page_h * 0.88:
                continue
            
            img_area = w * h
            if img_area / page_area > 0.6:
                continue
            
            # Skip large background images
            if w > page_w * 0.92 and img_area / page_area > 0.75:
                continue
            
            # This is likely a diagram content image
            pad = 10
            c_x0 = max(0.0, x0 - pad)
            c_y0 = max(0.0, y0 - pad)
            c_x1 = min(page_w, x1 + pad)
            c_y1 = min(page_h, y1 + pad)
            
            final_scale = 150 / 72
            est_w = (c_x1 - c_x0) * final_scale
            est_h = (c_y1 - c_y0) * final_scale
            
            if est_w * est_h > MAX_PIXELS:
                final_scale *= math.sqrt(MAX_PIXELS / (est_w * est_h))
            
            clip = fitz.Rect(c_x0, c_y0, c_x1, c_y1)
            cropped = fitz_page.get_pixmap(
                matrix=fitz.Matrix(final_scale, final_scale),
                clip=clip,
                colorspace=fitz.csRGB
            )
            b64 = base64.b64encode(cropped.tobytes('png')).decode('utf-8')
            crops.append(b64)
        except Exception:
            continue
    
    return crops


def extract_table_as_image(plumber_page, fitz_page, target_dpi=200):
    """
    Detect tables in the page and extract them as cropped images.
    Returns list of dict with {bbox, image_base64, row_count, col_count}.
    """
    try:
        import fitz, base64, math
    except ImportError:
        return []

    table_images = []
    page_w = plumber_page.width or 595
    page_h = plumber_page.height or 792
    max_pixels = 2_000_000
    pad = 10

    try:
        # Find tables using pdfplumber
        tables = plumber_page.find_tables()
        table_bboxes = tables.export().get('bboxes', []) if tables else []

        if not table_bboxes:
            return []

        for tb in table_bboxes:
            try:
                # tb is a dict with 'bbox': (x0, y0, x1, y1)
                bbox = tb.get('bbox', None)
                if not bbox:
                    continue

                x0, y0, x1, y1 = bbox
                width = x1 - x0
                height = y1 - y0

                # Filter: skip tiny or too large tables
                if width < 50 or height < 30:
                    continue
                if width > page_w * 0.95 or height > page_h * 0.8:
                    continue

                # Add padding
                c_x0 = max(0.0, x0 - pad)
                c_y0 = max(0.0, y0 - pad)
                c_x1 = min(page_w, x1 + pad)
                c_y1 = min(page_h, y1 + pad)

                # Calculate scale for target DPI
                scale = target_dpi / 72
                est_w = (c_x1 - c_x0) * scale
                est_h = (c_y1 - c_y0) * scale
                total_pixels = est_w * est_h

                # Scale down if exceeds max pixels
                if total_pixels > max_pixels:
                    scale *= math.sqrt(max_pixels / total_pixels)

                # Render to image
                clip = fitz.Rect(c_x0, c_y0, c_x1, c_y1)
                pixmap = fitz_page.get_pixmap(
                    matrix=fitz.Matrix(scale, scale),
                    clip=clip,
                    colorspace=fitz.csRGB
                )
                img_base64 = base64.b64encode(pixmap.tobytes('png')).decode('utf-8')

                # Extract table data for metadata
                table_data = None
                try:
                    extracted = tables.extract_between(bbox)
                    if extracted:
                        table_data = extracted
                except:
                    pass

                # Estimate rows/cols from extracted data
                rows = 0
                cols = 0
                if table_data:
                    rows = len(table_data) if isinstance(table_data, list) else 0
                    cols = len(table_data[0]) if rows > 0 and isinstance(table_data[0], list) else 0

                table_images.append({
                    "bbox": [float(c_x0), float(c_y0), float(c_x1), float(c_y1)],
                    "image": img_base64,
                    "width_px": int(est_w),
                    "height_px": int(est_h),
                    "row_count": rows,
                    "col_count": cols,
                    "type": "table"
                })

            except Exception as e:
                print(f'[pythonPdfExtractor] table crop error: {e}', flush=True)
                continue

    except Exception as e:
        print(f'[pythonPdfExtractor] table detection error: {e}', flush=True)

    return table_images


def extract_map_regions(plumber_page, fitz_page):
    """
    Detect map-like regions using text position strategy:
    1. Find "Label the map/plan/diagram" instruction text
    2. The map is BELOW/AFTER that instruction (typical IELTS layout)
    3. Crop the region below the instruction
    
    Returns list of dict with {bbox, image_base64, type, label}.
    """
    try:
        import fitz, base64, math, re
    except ImportError:
        return []

    map_images = []
    page_w = plumber_page.width or 595
    page_h = plumber_page.height or 792
    max_pixels = 2_000_000
    
    # Get page text
    try:
        page_text = plumber_page.extract_text() or ""
        fitz_dict = fitz_page.get_text("dict")
    except:
        return []

    # Map instruction patterns
    map_instruction_patterns = [
        r'lab[\s\n]*el[\s\n]*the[\s\n]*map',
        r'lab[\s\n]*el[\s\n]*the[\s\n]*plan', 
        r'lab[\s\n]*el[\s\n]*the[\s\n]*diagram',
        r'plan[\s\n]*below',
        r'map[\s\n]*below',
        r'diagram[\s\n]*below',
    ]
    instruction_pattern = re.compile('|'.join(map_instruction_patterns), re.IGNORECASE)
    
    # Find instruction text position
    instruction_y = None
    for block in fitz_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        block_text = ""
        for line in block.get("lines", []):
            line_text = "".join(span["text"] for span in line.get("spans", []))
            block_text += line_text
        
        if instruction_pattern.search(block_text):
            bbox = block.get("bbox", [0, 0, 0, 0])
            # Get the TOP of the instruction text (y0 in fitz coords = top of text)
            instruction_y = bbox[1]
            break
    
    if instruction_y is None:
        return []

    # The map is BELOW the instruction text (higher y values in PDF coords)
    # Leave margin above the instruction
    map_top = instruction_y - 5  # Start slightly above instruction
    
    # Calculate crop region: from instruction downwards
    # Leave some margins on sides
    crop_left = page_w * 0.03
    crop_right = page_w * 0.97
    
    # The map typically takes up a reasonable portion of the page
    # Don't crop too far down - maps are usually not at very bottom
    crop_bottom = min(map_top + page_h * 0.55, page_h * 0.85)
    
    # Ensure valid crop region
    if map_top < page_h * 0.1 or map_top > page_h * 0.7:
        # Instruction is at unusual position, use a broader region
        map_top = page_h * 0.15
    
    if crop_bottom - map_top < 80:
        return []
    
    # Render the map region
    try:
        scale = 150 / 72
        est_w = (crop_right - crop_left) * scale
        est_h = (crop_bottom - map_top) * scale
        total_pixels = est_w * est_h

        if total_pixels > max_pixels:
            scale *= math.sqrt(max_pixels / total_pixels)

        clip = fitz.Rect(crop_left, map_top, crop_right, crop_bottom)
        pixmap = fitz_page.get_pixmap(
            matrix=fitz.Matrix(scale, scale),
            clip=clip,
            colorspace=fitz.csRGB
        )
        img_base64 = base64.b64encode(pixmap.tobytes('png')).decode('utf-8')

        # Find instruction text for label
        match = instruction_pattern.search(page_text)
        label = ""
        if match:
            label = page_text[max(0, match.start()-20):min(len(page_text), match.end()+30)]
            label = label.replace('\n', ' ')[:100]

        map_images.append({
            "bbox": [float(crop_left), float(map_top), float(crop_right), float(crop_bottom)],
            "image": img_base64,
            "width_px": int(est_w),
            "height_px": int(est_h),
            "type": "map",
            "label": label,
        })
    except Exception:
        pass

    return map_images


def extract_pdf(file_path):
    try:
        import pdfplumber
        import fitz
        import re as _re
        pages_data = []

        with pdfplumber.open(file_path) as pdf:
            fitz_doc = fitz.open(file_path)
            
            # Phase 2: Global Pre-scan for headers/footers + watermark xrefs
            try:
                global_artifacts = _detect_repeated_artifacts(fitz_doc)
            except Exception as artifact_err:
                print(f'[pythonPdfExtractor] Pre-scan error: {artifact_err}', flush=True)
                global_artifacts = set()
            
            # Build document-level watermark xrefs: images appearing on many pages OR with high coverage
            watermark_xrefs = set()
            xref_page_count = {}
            xref_sizes = {}  # xref -> set of sizes (width x height)
            for fp in fitz_doc:
                for img_info in fp.get_images(full=True):
                    xref = img_info[0]
                    xref_page_count[xref] = xref_page_count.get(xref, 0) + 1
                    # Track image sizes on each page
                    try:
                        rects = fp.get_image_rects(xref)
                        if rects:
                            r = rects[0]
                            size = f"{int(r.width)}x{int(r.height)}"
                            if xref not in xref_sizes:
                                xref_sizes[xref] = set()
                            xref_sizes[xref].add(size)
                    except:
                        pass
            
            # Watermark =:
            # 1. Image appearing on >3 pages (background pattern)
            # 2. OR same size on >5 pages (template/watermark with consistent size/position)
            for xref, count in xref_page_count.items():
                if count > 3:
                    watermark_xrefs.add(xref)
                elif xref in xref_sizes and len(xref_sizes[xref]) == 1 and count >= 5:
                    # Same size on all appearances = watermark
                    watermark_xrefs.add(xref)
            
            # Set global for extract_diagram_regions
            import sys
            sys.modules[__name__]._doc_watermark_xrefs = watermark_xrefs
            sys.modules[__name__]._doc_xref_pages = xref_page_count
            
            for i, page in enumerate(pdf.pages):
                try:
                    fitz_page = fitz_doc[i]
                    
                    # ── 1. Text Density & Scanned Detection (Phase 3) ──
                    raw_fitz_text = fitz_page.get_text("text")
                    text_density = len(raw_fitz_text.strip())
                    # Scanned PDF detection: text is minimal relative to page area
                    # AND has significant images (scanned pages have text-as-image)
                    page_area = page.width * page.height if page.width and page.height else 595 * 792
                    is_scanned = text_density < 100 and len(page.images) > 0 and text_density < page_area * 0.05
                    # OCR recommended when: definitely scanned OR text is too sparse
                    ocr_recommended = is_scanned or text_density < 50
                    
                    # ── 2. Primary: pdfplumber layout-aware extraction ──
                    text = ""
                    tables = page.find_tables()
                    
                    if not is_scanned:
                        text = page.extract_text(layout=True) or ""

                    # ── 3. Fallback: fitz-based block extraction ──
                    if not text or not text.strip():
                        text = _extract_text_with_fitz(fitz_page, artifacts=global_artifacts, plumber_tables=tables)

                    # ── 5. Cleanup ──
                    # Final pass to remove common patterns if they somehow escaped artifact detection
                    text = _re.sub(r'^\s*Page\s+\d+\s+of\s+\d+\s*$', '', text, flags=_re.MULTILINE)

                    # ── 6. Diagram Detection ──
                    # Check if this page contains maps (maps are expected to have text labels)
                    is_map_page = _detect_map_heuristic(page)
                    
                    # Recalculate real_images for metadata
                    real_images = 0
                    page_height = page.height or 792
                    page_width = page.width or 595
                    page_area = page_width * page_height
                    for img in page.images:
                        try:
                            w, h = img.get('width', 0), img.get('height', 0)
                            area = w * h
                            img_x0 = img.get('x0', 0)
                            img_top = img.get('top', 0)
                            img_x1 = img.get('x1', w)
                            img_bottom = img.get('bottom', h)
                            # Skip tiny images (logos, watermarks, decorative icons)
                            # Must be at least 100x100px AND cover at least 3% of page area
                            if area < 10000:
                                continue
                            if area / page_area < 0.03:
                                continue
                            # Skip images in footer zone (bottom 12% of page) — likely logos
                            if img_top > page_height * 0.88:
                                continue
                            # Skip watermarks: large images with significant text drawn over them
                            # BUT: for maps, text labels ON the map are expected content, not watermark
                            img_bbox = (img_x0, img_top, img_x1, img_bottom)
                            is_likely_map = is_map_page and w > 100 and h > 80
                            if _is_watermark_by_text_overlap(img_bbox, page, fitz_page, overlap_threshold=0.25, is_map_content=is_likely_map):
                                continue
                            real_images += 1
                        except Exception: continue

                    diagram_crops = []
                    try:
                        diagram_crops = extract_diagram_regions(page, fitz_page)
                    except Exception as crop_err:
                        print(f'[pythonPdfExtractor] page {i} crop error: {crop_err}', flush=True)

                    # ── 7. Table Detection & Crop ──
                    table_images = []
                    try:
                        table_images = extract_table_as_image(page, fitz_page)
                    except Exception as table_err:
                        print(f'[pythonPdfExtractor] page {i} table extraction error: {table_err}', flush=True)

                    # Fallback: detect tables from text patterns if pdfplumber missed them
                    if len(table_images) == 0:
                        text_based_tables = _detect_tables_from_text(page)
                        for t in text_based_tables:
                            if t.get("type") == "detected_from_text":
                                # Create a placeholder for text-based table detection
                                table_images.append({
                                    "bbox": t["bbox"],
                                    "row_count": t["row_count"],
                                    "col_count": t["col_count"],
                                    "type": "text_detected",
                                    "has_text_pattern": True
                                })

                    # ── 8. Map Detection & Crop ──
                    map_images = []
                    try:
                        map_images = extract_map_regions(page, fitz_page)
                    except Exception as map_err:
                        print(f'[pythonPdfExtractor] page {i} map extraction error: {map_err}', flush=True)

                    # ── 9. Vector Diagram Detection (flowcharts, vector maps) ──
                    vector_diagrams = []
                    try:
                        vector_diagrams = extract_vector_diagram_regions(page, fitz_page)
                    except Exception as vec_err:
                        print(f'[pythonPdfExtractor] page {i} vector diagram error: {vec_err}', flush=True)

                    # Collect all map bbox to avoid duplicates
                    existing_map_bboxes = set()
                    for m in map_images:
                        bbox = m.get('bbox', [])
                        if len(bbox) == 4:
                            existing_map_bboxes.add(tuple(bbox[:2]))  # Store top-left corner

                    # Merge vector diagrams into appropriate categories
                    # - Flowcharts → diagramCrops
                    # - Vector maps → also diagramCrops (for Listening compatibility)
                    #   Note: listeningParser.js only checks diagramCrops, not mapImages
                    for vd in vector_diagrams:
                        if vd.get("type") == "flowchart":
                            diagram_crops.append(vd.get("image"))
                        elif vd.get("type") == "map":
                            vd_bbox = vd.get('bbox', [])
                            # Check if this bbox already exists in map_images
                            is_duplicate = False
                            if len(vd_bbox) == 4:
                                for existing in existing_map_bboxes:
                                    if abs(vd_bbox[0] - existing[0]) < 20 and abs(vd_bbox[1] - existing[1]) < 20:
                                        is_duplicate = True
                                        break
                            if not is_duplicate:
                                # Maps should also be in diagramCrops so Listening parser can see them
                                if vd.get("image"):
                                    diagram_crops.append(vd.get("image"))
                                # Also keep in mapImages for other parsers (Reading, etc.)
                                map_images.append(vd)
                                if len(vd_bbox) == 4:
                                    existing_map_bboxes.add(tuple(vd_bbox[:2]))

                    pages_data.append({
                        "pageIndex": i,
                        "text": text,
                        "imageCount": real_images,
                        "diagramCrops": diagram_crops,
                        "tableImages": table_images,
                        "mapImages": map_images,
                        "metadata": {
                            "isScanned": is_scanned,
                            "ocrRecommended": ocr_recommended,
                            "textDensity": text_density,
                            "isMultiColumn": "multi_column" in str(getattr(fitz_page, 'get_text', lambda x: "")("dict")), # rough check
                            "hasTables": len(table_images) > 0,
                            "hasMaps": len(map_images) > 0,
                            "hasDiagrams": len(diagram_crops) > 0,
                            "tableCount": len(table_images),
                            "mapCount": len(map_images),
                            "diagramCount": len(diagram_crops),
                            "hasTextBasedTables": any(t.get("has_text_pattern") for t in table_images),
                        }
                    })
                except Exception as page_err:
                    pages_data.append({
                        "pageIndex": i,
                        "text": "",
                        "error": str(page_err)
                    })

            fitz_doc.close()

        return {
            "success": True,
            "pages": pages_data,
            "errors": []
        }
    except Exception as e:
        return {
            "success": False,
            "pages": [],
            "errors": [{"step": "python-pdf-extraction", "err": str(e), "trace": traceback.format_exc()}]
        }


# ─────────────────────────────────────────────────────────────────────────────
# LISTENING SEGMENT EXTRACTION
# Generic pipeline that works with ANY IELTS Listening PDF format.
# Each "Questions X–Y" range = 1 segment with its own cropped image + text.
# ─────────────────────────────────────────────────────────────────────────────

def extract_listening_segments(pdf_path, options=None):
    """
    Extract IELTS Listening questions grouped by "Questions X–Y" ranges.

    Pipeline:
      1. Render pages (pdf2image)
      2. Parse layout + detect section/question-range labels (pdfplumber)
      3. Build segment definitions (part, question_range, page_range, bbox)
      4. Crop segment images
      5. Extract text: text_layer (priority) | PaddleOCR (scanned fallback)
      6. Stack multi-page crops

    Args:
        pdf_path:  path to PDF file
        options:   { dpi: int, lazy_pages: bool }

    Returns:
        {
          success: bool,
          segments: [{
            segmentId, segmentIndex, part, partLabel,
            questionStart, questionEnd, questionRange,
            pageRange, pdfBbox,
            segmentImage (base64 PNG, stacked if multi-page),
            fullPageImages (lazy),
            text, ocrMode, textLayerAvailable,
            metadata: { detectionMode, inferred, footerY, scale, dpi, multiPage, rawPageCount }
          }],
          fullDocPages: [base64 PNG] (lazy),
          pageCount, segmentCount,
          metadata: { scanned, ocrMode, dpi, scale }
        }
    """
    try:
        import pdfplumber, base64, re, fitz, io
        from PIL import Image
    except ImportError as e:
        return {
            "success": False,
            "segments": [],
            "errors": [{"step": "import", "err": f"Missing dependency: {e}"}],
        }

    options = options or {}
    dpi = options.get("dpi", 200)
    lazy_pages = options.get("lazy_pages", True)

    # ── Pattern definitions ────────────────────────────────────────────────────
    PART_PATTERNS = [
        re.compile(r'^(PART|SECTION)\s+([1-4])\b', re.I),
        re.compile(r'^(PART|SECTION)$', re.I),
    ]
    QR_PATTERNS = [
        re.compile(r'^Questions?\s*(\d+)\s*[\-–\u2013]\s*(\d+)$', re.I),
        re.compile(r'^Q\s*(\d+)\s*[\-–\u2013]\s*Q?\s*(\d+)$', re.I),
        re.compile(r'^(\d+)\s*[\-–\u2013]\s*(\d+)$', re.I),
    ]
    QR_NUMBER_PATTERNS = [
        re.compile(r'^(\d+)\.?$'),
    ]
    FOOTER_PATTERNS = [
        re.compile(r'ielts', re.I),
        re.compile(r'\.com', re.I),
        re.compile(r'^page\s+\d+', re.I),
        re.compile(r'^©'),
    ]

    # ── Cross-word detection helpers ────────────────────────────────────────────
    def find_part_markers(words):
        """Find PART/SECTION markers where number may be a separate word.
        Matches: "Part 1", "PART 1", "Part 2", "Section 1", etc. (case-insensitive).
        """
        markers = []
        n = len(words)
        for i, w in enumerate(words):
            t = w['text'].strip()
            m = re.match(r'^(PART|SECTION|Part|Section|part|section)$', t)
            if m:
                if i + 1 < n:
                    next_t = words[i + 1]['text'].strip()
                    nm = re.match(r'^([1-4])$', next_t)
                    if nm:
                        markers.append({'word_idx': i, 'value': f"PART {nm.group(1)}", 'part_num': int(nm.group(1))})
                        continue
                m2 = re.match(r'^(?:PART|SECTION)\s*([1-4])\b', t, re.I)
                if m2:
                    markers.append({'word_idx': i, 'value': f"PART {m2.group(1)}", 'part_num': int(m2.group(1))})
                else:
                    # Try lowercase "Part X" pattern where "Part" and number are together
                    m3 = re.match(r'^Part\s*([1-4])\b', t, re.I)
                    if m3:
                        markers.append({'word_idx': i, 'value': f"PART {m3.group(1)}", 'part_num': int(m3.group(1))})
        return markers

    def find_qr_markers(words, page_text=None):
        """Find question range markers, handling cross-word ranges like 'Questions 1 – 10'.

        Strategy: Only look for explicit "Questions X-Y" headers.
        REMOVED: pattern for standalone single numbers - they create too many false positives
        (e.g., answer key entries like "1 South West").
        IELTS sections ALWAYS have "Questions X-Y" or "Q X-Y" format.
        """
        markers = []
        _consumed_q_indices = set()  # word indices where "Questions/Q" was consumed by Pattern A or B
        n = len(words)
        DASH = re.compile(r'^[\-–\u2013to\?]+$', re.I)
        # Handle embedded en-dash or question-mark range like "1–10", "17–20", or "21?30"
        EMBEDDED_RANGE = re.compile(r'^(\d+)\s*([\-\u2013?])\s*(\d+)$')

        for i, w in enumerate(words):
            t = w['text'].strip()

            # ── Pattern A: "Questions N" or "Q N" followed by separate dash + number ──
            matched = False
            for pat in [
                re.compile(r'^Questions?\s*(\d+)$', re.I),
                re.compile(r'^Q\s*(\d+)$', re.I),
            ]:
                m = pat.match(t)
                if not m:
                    continue
                q_start = int(m.group(1))
                for j in range(i + 1, min(i + 5, n)):
                    dash_t = words[j]['text'].strip()
                    if DASH.match(dash_t):
                        for k in range(j + 1, min(j + 3, n)):
                            end_t = words[k]['text'].strip()
                            ne = re.match(r'^(\d+)$', end_t)
                            if ne:
                                q_end = int(ne.group(1))
                                if q_end > q_start and q_end <= 50:
                                    markers.append({'word_idx': i, 'q_start': q_start, 'q_end': q_end})
                                    matched = True
                                    _consumed_q_indices.add(i)
                                    break
                        break
                if matched:
                    break

            # ── Pattern B: "Questions N-M" where N-M is one word (en-dash or ? embedded) ──
            # Only run if Pattern A did not consume this word
            if not matched and i not in _consumed_q_indices:
                if i + 1 < n:
                    next_t = words[i + 1]['text'].strip()
                    rm = EMBEDDED_RANGE.match(next_t)
                    if rm:
                        qs = int(rm.group(1))
                        qe = int(rm.group(3))
                        if qe > qs and qe <= 50:
                            markers.append({'word_idx': i, 'q_start': qs, 'q_end': qe})
                            _consumed_q_indices.add(i)
                            _consumed_q_indices.add(i + 1)
                            continue

                # Also try: current word itself is the full range like "17–20"
                if i not in _consumed_q_indices:
                    rm2 = EMBEDDED_RANGE.match(t)
                    if rm2 and not t.upper().startswith('Q'):
                        qs = int(rm2.group(1))
                        qe = int(rm2.group(3))
                        if qe > qs and qe <= 50:
                            markers.append({'word_idx': i, 'q_start': qs, 'q_end': qe})

        return markers

    # ── Step 1: Render pages ──────────────────────────────────────────────────
    try:
        # Use PyMuPDF (fitz) instead of pdf2image/Poppler — much faster, no external deps
        fitz_doc = fitz.open(pdf_path)
        zoom = dpi / 72
        mat = fitz.Matrix(zoom, zoom)
        pil_pages = []
        for fitz_page in fitz_doc:
            pix = fitz_page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
            pil_img = Image.open(io.BytesIO(pix.tobytes('png')))
            pil_pages.append(pil_img)
        fitz_doc.close()
    except Exception as e:
        return {"success": False, "segments": [], "errors": [{"step": "render", "err": str(e)}]}

    page_count = len(pil_pages)

    # Determine actual PDF page heights via pdfplumber (per-page scale)
    with pdfplumber.open(pdf_path) as pdf:
        page_scales = []
        for i, (pil_p, plumber_p) in enumerate(zip(pil_pages, pdf.pages)):
            s = pil_p.height / plumber_p.height
            page_scales.append(s)

    # ── Step 2: Parse layout ──────────────────────────────────────────────────
    sections = []   # list of {page, y, type, value, q_start?, q_end?}
    page_layouts = []  # list of {page_num, words, footer_y, page_h}

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):
            words = page.extract_words()

            page_height = page.height or 792
            page_width = page.width or 612

            # Find footer y
            footer_y = page_height * 0.92
            for w in words:
                text = w['text'].strip()
                if any(pat.search(text) for pat in FOOTER_PATTERNS):
                    footer_y = min(footer_y, w['top'])

            # Detect column layout on this page (for multi-column IELTS PDFs).
            # On pages with a left question column + right answer column, we crop
            # only the left content area to avoid including the answer column in crops.
            #
            # Robust 2-column detection:
            #   1. Cluster x positions into 2 groups (k-means).
            #   2. Check if both groups are "substantial" and separated by a real gap.
            #   3. Only enable column cutoff when there's a genuine two-column layout.
            col_x1_pt = page_width
            if words and len(words) >= 10:
                x_pos = [w["x0"] for w in words]
                mean_x = sum(x_pos) / len(x_pos)

                # k=2 clustering via simple midpoint split
                left_x = sorted([x for x in x_pos if x < mean_x])
                right_x = sorted([x for x in x_pos if x >= mean_x])

                if left_x and right_x:
                    left_spread = left_x[-1] - left_x[0]
                    right_spread = right_x[-1] - right_x[0]
                    left_centroid = sum(left_x) / len(left_x)
                    right_centroid = sum(right_x) / len(right_x)
                    gap = min(right_x) - max(left_x)

                    # Real 2-column page: both sides have similar spread,
                    # there is a clear gap between them (>= 30pt),
                    # and gap is meaningful relative to page width (>= 10%).
                    is_two_column = (
                        len(left_x) >= 5 and len(right_x) >= 5
                        and gap >= 30
                        and gap / page_width >= 0.10
                        and abs(left_spread - right_spread) < page_width * 0.4
                    )

                    if is_two_column:
                        col_x1_pt = min((min(right_x) + max(left_x)) / 2.0, page_width * 2 / 3)
                    # else: keep col_x1_pt = page_width (single-column, no cutoff)

            page_layouts.append({
                "page_num": page_num,
                "words": words,
                "chars": page.chars,
                "footer_y": footer_y,
                "page_h": page_height,
                "col_x1_pt": col_x1_pt,
            })

            # Scan for PART/SECTION headers (cross-word aware)
            part_markers = find_part_markers(words)
            if part_markers:
                # Take the FIRST "Part/Section" on the page that has a number after it.
                # This correctly picks "Part 2" (header) over "Part 1" (transcript reference).
                marker = part_markers[0]
                sections.append({
                    "page": page_num, "y": words[marker['word_idx']]['top'],
                    "type": "part",
                    "value": marker['value'],
                })

            # Scan for Question Range labels (cross-word aware)
            qr_markers = find_qr_markers(words)
            # DEBUG: print QR markers per page
            if qr_markers:
                sys.stderr.write(f"[DEBUG] Page {page_num}: QR markers = {[(m['q_start'], m['q_end']) for m in qr_markers]}\n")
            for marker in qr_markers:
                if marker['q_start'] != marker['q_end']:
                    sections.append({
                        "page": page_num, "y": words[marker['word_idx']]['top'],
                        "type": "question_range",
                        "q_start": marker['q_start'], "q_end": marker['q_end'],
                        "word_idx": marker['word_idx'],
                    })

    # ── Step 3: Build segment definitions with precise bbox ────────────────────
    MARGIN = 2  # minimal buffer pt — only to avoid rounding edge cases
    EPSILON = 1.0  # pt — small gap between segments

    def heading_block_bbox(words, start_idx, end_idx):
        """Return (top, bottom) bbox of words[start_idx..end_idx] in pdf-pt coords."""
        ws = words[start_idx:end_idx + 1]
        return min(w['top'] for w in ws), max(w['bottom'] for w in ws)

    def last_real_char_bottom_on_page(chars, from_y, until_y):
        """Find the bottom-most real content char between from_y and until_y (inclusive)."""
        real = [c for c in chars if from_y <= c['top'] <= until_y and
                bool(c['text'] and c['text'].strip())]
        if not real:
            return None
        return max(c.get('bottom', c['top']) for c in real)

    def footer_y_for_page(page_num, page_layouts, pdf_h):
        """Return footer y for a page, using detected footer or 92% of page height."""
        layout = page_layouts[page_num]
        fy = layout.get("footer_y")
        if fy is None or fy >= pdf_h * 0.99:
            return pdf_h * 0.92
        return fy

    segments_raw = []
    sections_sorted = sorted(sections, key=lambda s: (s['page'], s['y']))

    # ── First pass: pre-compute heading bboxes for all QR sections ──────────────
    for s in sections_sorted:
        if s["type"] == "question_range":
            page_num = s["page"]
            layout = page_layouts[page_num]
            words = layout["words"]
            start_idx = s.get("word_idx")
            if start_idx is not None and start_idx < len(words):
                # Find the end-number word index
                n = len(words)
                dash_idx = None
                end_idx = None
                for j in range(start_idx + 1, min(start_idx + 6, n)):
                    t = words[j]['text'].strip()
                    if re.match(r'^[\-–\u2013to]+$', t, re.I):
                        dash_idx = j
                        for k in range(j + 1, min(j + 4, n)):
                            if re.match(r'^\d+$', words[k]['text'].strip()):
                                end_idx = k
                                break
                        break
                if end_idx is None:
                    end_idx = start_idx
                h_top, h_bottom = heading_block_bbox(words, start_idx, end_idx)
                s["heading_top"] = h_top
                s["heading_bottom"] = h_bottom
                s["heading_end_idx"] = end_idx

    # ── Second pass: build segments ────────────────────────────────────────────
    # Strategy: close previous segment WHEN we see a new one.
    # For same-page: y_end = heading_top - MARGIN
    # For cross-page:  y_end = footer of the page the previous segment ends on
    current_part = 1
    current_seg = None
    last_part_marker = None  # Track the most recent PART marker seen
    for marker in sections_sorted:
        page_num = marker["page"]
        mtype = marker["type"]

        if mtype == "part":
            part_num = int(re.search(r'\d', marker['value']).group())
            part_top = marker.get("heading_top", marker["y"])

            # Fix: When a PART marker appears at the TOP of a page (y < threshold),
            # it means the previous PART's content overflows onto this page.
            # Extend the previous segment across all pages between current_seg and this PART.
            if current_seg is not None:
                prev_end = current_seg["page_end"]
                if prev_end < page_num and part_top < 200:
                    # There are pages between the previous segment and this PART marker.
                    # Extend the previous segment to include the PART marker's page
                    # up to the PART marker's y position.
                    # But ONLY if those pages don't already have a QR marker (they're overflow).
                    # Check: are there ANY QR markers on the pages between?
                    segs_on_pages = [s for s in sections_sorted
                                     if s["type"] == "question_range"
                                     and prev_end < s["page"] <= page_num]
                    if not segs_on_pages:
                        # No QR markers in between — this is pure overflow
                        current_seg["page_end"] = page_num
                        current_seg["y_end"] = part_top - MARGIN

            last_part_marker = marker
            current_part = part_num
            continue

        # question_range marker
        heading_top = marker.get("heading_top")
        if heading_top is None:
            heading_top = marker["y"]

        layout = page_layouts[page_num]
        chars = layout.get("chars", [])
        pdf_h = layout.get("page_h", 792)
        footer_y = footer_y_for_page(page_num, page_layouts, pdf_h)

        # Determine content end for THIS segment
        next_qr = None
        for s2 in sections_sorted:
            if s2["page"] == page_num and s2["type"] == "question_range" and s2["y"] > marker["y"] + 0.1:
                if next_qr is None or s2["y"] < next_qr["y"]:
                    next_qr = s2

        if next_qr:
            # Next heading found — content ends before it
            next_top = next_qr.get("heading_top") or next_qr["y"]
            last_bot = last_real_char_bottom_on_page(chars, heading_top, next_top - MARGIN)
            content_end_y = (last_bot + EPSILON) if last_bot is not None else (next_top - MARGIN)
        else:
            # Last segment on this page — content goes to footer
            last_bot = last_real_char_bottom_on_page(chars, heading_top, footer_y)
            content_end_y = (last_bot + EPSILON) if last_bot is not None else footer_y

        # ── Close previous segment ────────────────────────────────────────────
        if current_seg is not None:
            prev_end = current_seg["page_end"]
            prev_start = current_seg["page_start"]
            if prev_end < page_num:
                # Previous segment ended on a PREVIOUS page
                current_seg["page_end"] = page_num - 1
                current_seg["y_end"] = footer_y_for_page(
                    current_seg["page_end"], page_layouts, pdf_h)
            elif prev_end == page_num:
                # Same page: close at next heading's top OR at footer if PART marker separates.
                # Check if there's a PART marker between this segment's content and the next QR.
                # If so, extend to page footer (PART 1 overflow goes to footer, not to PART 2 marker).
                has_part_in_between = any(
                    s for s in sections_sorted
                    if s["page"] == page_num
                    and s["type"] == "part"
                    and current_seg["page_start"] < page_num
                    and s["y"] > current_seg["y_start"]
                    and (marker["y"] > s["y"])
                )
                if has_part_in_between:
                    # Extend to footer: PART 1 overflow goes all the way to footer
                    current_seg["page_end"] = page_num
                    current_seg["y_end"] = footer_y_for_page(page_num, page_layouts, pdf_h)
                else:
                    current_seg["page_end"] = page_num
                    current_seg["y_end"] = heading_top - MARGIN
            segments_raw.append({**current_seg})

        # ── Infer PART from question number range as fallback ─────────────────────
        # When PART markers aren't detected early enough (e.g. Q17-20 before PART 3
        # on same page), the tracked current_part is wrong. Infer from question range.
        PART_Q_RANGES = {1: (1, 10), 2: (11, 20), 3: (21, 30), 4: (31, 40)}
        qs, qe = marker["q_start"], marker["q_end"]
        for part_num, (lo, hi) in PART_Q_RANGES.items():
            if lo <= qs <= hi or lo <= qe <= hi:
                current_part = part_num
                break

        # ── Open new segment ──────────────────────────────────────────────────
        current_seg = {
            "part": current_part,
            "question_start": marker["q_start"],
            "question_end": marker["q_end"],
            "question_range_label": f"Questions {marker['q_start']}-{marker['q_end']}",
            "page_start": page_num,
            "page_end": page_num,
            "y_start": heading_top,
            "y_end": content_end_y,
            "detection_mode": "explicit",
            "inferred": False,
        }

    # ── Close final segment ──────────────────────────────────────────────────
    if current_seg is not None:
        last_page = page_count - 1
        current_seg["page_end"] = last_page
        current_seg["y_end"] = footer_y_for_page(last_page, page_layouts, pdf_h)
        segments_raw.append({**current_seg})

    # ── Fill gaps: number-pattern fallback ─────────────────────────────────────
    # Expected question number ranges per PART (for IELTS Listening)
    PART_Q_RANGES = {
        1: (1, 10),
        2: (11, 20),
        3: (21, 30),
        4: (31, 40),
    }

    # Pages with explicit PART markers (used to determine if a page belongs to a known PART)
    part_pages = {}  # page_num -> part_num (only pages with explicit PART markers)
    for sec in sections_sorted:
        if sec["type"] == "part":
            pn = int(re.search(r'\d', sec['value']).group())
            part_pages[sec["page"]] = pn

    def is_in_expected_range(q_num, part_num):
        """Check if q_num falls within expected range for the given part."""
        if part_num not in PART_Q_RANGES:
            return True  # Unknown part - accept all
        lo, hi = PART_Q_RANGES[part_num]
        return lo <= q_num <= hi

    def detect_question_numbers(words, part_num=1):
        """Return list of (q_num, top_y) from standalone numbers like '1.', 'Q15'.

        IMPORTANT: Only returns numbers within the expected IELTS Listening range for
        the given part. This prevents answer key numbers from creating false segments.

        Also filters out numbers at the LEFT MARGIN (answer table column) by checking x0 position.
        In answer key documents, the answer column has numbers at x0 < 150 (left margin),
        while actual question headings have numbers at different positions.
        """
        results = []
        MARGIN_X_THRESHOLD = 120  # words at x0 < 120 are likely in the answer column

        for w in words:
            text = w['text'].strip()
            for pat in QR_NUMBER_PATTERNS:
                m = pat.match(text)
                if m:
                    num = int(m.group(1))
                    # FIX: Check ALL possible PART ranges, not just the tracked_part.
                    # This prevents Q11 from being rejected when page 2 has PART 2 marker.
                    valid_in_any_part = any(lo <= num <= hi for lo, hi in PART_Q_RANGES.values())
                    if valid_in_any_part:
                        # Skip numbers at left margin (answer column)
                        if w.get('x0', 999) < MARGIN_X_THRESHOLD:
                            continue
                        results.append((num, w['top']))
        return sorted(results, key=lambda x: x[0])

    def infer_part_from_previous(segments_list, page_num):
        """Find the most recent PART that appeared before this page."""
        for seg in reversed(segments_list):
            if seg.get("page_end", -1) < page_num:
                return seg.get("part")
        return 1

    covered_pages = set()
    for seg in segments_raw:
        for p in range(seg["page_start"], seg["page_end"] + 1):
            covered_pages.add(p)

    # ── Track current_part from sections_sorted (from first-pass section scan) ──────────
    # Iterate sections_sorted in order so tracked_part always reflects the most
    # recent PART marker seen so far. sections_sorted only has PART markers (question_ranges
    # come from fallback). So we track tracked_part directly per page.
    tracked_part = 1
    tracked_part_by_page = {}
    for sec in sections_sorted:
        if sec["type"] == "part":
            tracked_part = int(re.search(r'\d', sec['value']).group())
        elif sec["type"] == "question_range":
            tracked_part_by_page[sec["page"]] = tracked_part

    for page_num, layout in enumerate(page_layouts):
        if page_num in covered_pages:
            continue
        # Update tracked_part for this page from section scan
        for sec in sections_sorted:
            if sec["page"] == page_num and sec["type"] == "part":
                tracked_part = int(re.search(r'\d', sec['value']).group())
                tracked_part_by_page[page_num] = tracked_part
                break

        # tracked_part now reflects the most recent PART marker at or before this page
        part_for_page = tracked_part_by_page.get(page_num, tracked_part)

        q_numbers = detect_question_numbers(layout["words"], part_for_page)

        # FIX: Determine correct PART from question numbers themselves, not from tracked_part.
        # This is more reliable than relying on section scan (which may miss PART markers).
        # E.g., page 2 has PART 2 marker but Q11 → should be PART 2.
        # E.g., page 3 has PART 2 marker but Q14 → should be PART 2 (but Q14 is in PART 1's range).
        # The Q-number ranges are authoritative for PART assignment in fallback.
        if q_numbers:
            first_q = q_numbers[0][0]
            for pnum, (lo, hi) in PART_Q_RANGES.items():
                if lo <= first_q <= hi:
                    part_for_page = pnum
                    break

        # Collect all valid question ranges from this page first
        page_segments = []
        if q_numbers:
            # Group consecutive numbers into ranges
            ranges = []
            range_start = q_numbers[0][0]
            range_top = q_numbers[0][1]
            prev_num = q_numbers[0][0]

            for qnum, top in q_numbers[1:]:
                if qnum == prev_num + 1:
                    prev_num = qnum
                else:
                    ranges.append((range_start, prev_num, range_top))
                    range_start = qnum
                    range_top = top
                    prev_num = qnum
            ranges.append((range_start, prev_num, range_top))

            for qs, qe, top_y in ranges:
                y_start = max(0.0, top_y - MARGIN)
                y_end = layout["footer_y"] - MARGIN

                # FIX: Keep single-number ranges. When a question number appears alone on a page
                # (the rest of the questions continue on the next page), the segment spans from
                # this number to the page footer. The is_covered deduplication handles merging
                # across pages for multi-page question ranges.
                # if qs == qe:
                #     continue  # REMOVED — this loses valid question markers

                # Override part assignment based on question number range.
                # This fixes the case where page 2 (index 2) has PART 2 marker and Q7-10 fallback.
                # Without this, Q7-10 would be assigned to PART 2 (wrong) instead of PART 1.
                fallback_part = part_for_page
                PART_Q_RANGES = {1: (1, 10), 2: (11, 20), 3: (21, 30), 4: (31, 40)}
                for pnum, (lo, hi) in PART_Q_RANGES.items():
                    if lo <= qs <= hi or lo <= qe <= hi:
                        fallback_part = pnum
                        break

                page_segments.append({
                    "part": fallback_part,
                    "question_start": qs,
                    "question_end": qe,
                    "question_range_label": f"Questions {qs}-{qe}",
                    "page_start": page_num,
                    "page_end": page_num,
                    "y_start": y_start,
                    "y_end": y_end,
                    "detection_mode": "number_pattern",
                    "inferred": False,
                })

        if not page_segments:
            # No valid question ranges — full page as one segment
            # IMPORTANT: Use page_height as y_end (not footer_y) to capture ALL content.
            # For answer key PDFs, "Questions X-Y" headers appear at the bottom of pages
            # and we must include them in the segment text.
            page_height = layout.get("page_h", 792)
            page_segments.append({
                "part": part_for_page,
                "question_start": None,
                "question_end": None,
                "question_range_label": f"Page {page_num + 1}",
                "page_start": page_num,
                "page_end": page_num,
                "y_start": 0.0,
                "y_end": page_height - MARGIN,
                "detection_mode": "full_block",
                "inferred": True,
            })

        # ── Now merge: deduplicate against existing segments_raw ──────────────────
        for new_seg in page_segments:
            qs, qe = new_seg["question_start"], new_seg["question_end"]

            # FIX: If this fallback segment overlaps with an existing segment on the SAME page,
            # MERGE them into one (extend the existing). This handles pages where the question
            # numbers are split into multiple groups (e.g., Q21, Q23, Q30 on page 4).
            same_page_overlap = next((s for s in segments_raw
                                 if s.get("part") == new_seg["part"]
                                 and s.get("question_start") is not None
                                 and s.get("page_start") == new_seg["page_start"]
                                 and s.get("question_start") <= new_seg["question_end"]
                                 and s.get("question_end") >= new_seg["question_start"]), None)
            if same_page_overlap:
                # Extend existing segment to cover both ranges
                same_page_overlap["question_start"] = min(same_page_overlap["question_start"], new_seg["question_start"])
                same_page_overlap["question_end"] = max(same_page_overlap["question_end"], new_seg["question_end"])
                same_page_overlap["y_start"] = min(same_page_overlap.get("y_start", 9999), new_seg["y_start"])
                same_page_overlap["y_end"] = max(same_page_overlap.get("y_end", 0), new_seg["y_end"])
                same_page_overlap["question_range_label"] = "Questions %d-%d" % (
                    same_page_overlap["question_start"], same_page_overlap["question_end"])
                continue

            # Skip if this exact segment already exists (same part + qs + qe + page)
            existing = next((s for s in segments_raw
                           if s.get("part") == new_seg["part"]
                           and s.get("question_start") == new_seg["question_start"]
                           and s.get("question_end") == new_seg["question_end"]
                           and s.get("page_start") == new_seg["page_start"]
                           and new_seg["question_start"] is not None), None)
            if existing:
                # Keep the one with the larger vertical span (more content)
                existing_span = existing.get("y_end", 0) - existing.get("y_start", 0)
                new_span = new_seg["y_end"] - new_seg["y_start"]
                if new_span > existing_span:
                    existing["y_start"] = new_seg["y_start"]
                    existing["y_end"] = new_seg["y_end"]
            else:
                segments_raw.append(new_seg)

    # ── Is scanned PDF? ───────────────────────────────────────────────────────
    with pdfplumber.open(pdf_path) as pdf:
        total_words = sum(len(p.extract_words()) for p in pdf.pages)
        is_scanned = total_words < 50

    # ── Lazy Tesseract OCR engine ───────────────────────────────────────────────
    _tesseract_path = None
    def get_tesseract_path():
        nonlocal _tesseract_path
        if _tesseract_path is None:
            import shutil
            # Use the installed tesseract
            tesseract_exe = shutil.which("tesseract")
            if tesseract_exe:
                _tesseract_path = tesseract_exe
            else:
                _tesseract_path = False
        return _tesseract_path if _tesseract_path else None

    def ocr_image(pil_img):
        """Run Tesseract OCR on a PIL image. Returns list of text lines."""
        import pytesseract
        tesseract_exe = get_tesseract_path()
        if not tesseract_exe:
            return []

        import numpy as np, cv2
        img_np = np.array(pil_img)
        if img_np.ndim == 2:
            img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2RGB)
        elif img_np.shape[2] == 4:
            img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2RGB)

        try:
            text = pytesseract.image_to_string(img_np, config='--psm 6')
            lines = [ln.strip() for ln in text.split('\n') if ln.strip()]
            return lines
        except Exception as e:
            sys.stderr.write(f"[extract_listening_segments] Tesseract OCR error: {e}\n")
            return []

    def crop_and_encode(pil_img, y0_px, y1_px, pad=4, max_x1_px=None):
        """Crop PIL image in pixel coords (x full-width, y as given), add white border, return base64 PNG."""
        from PIL import Image as PILImage
        h = pil_img.height
        w = pil_img.width
        y0 = max(0, y0_px - pad)
        y1 = min(h, y1_px + pad)
        # Keep full width for text-layer PDFs — column cutoff via max_x1_px is handled above.
        # Only add a small left pad to account for any rendering edge artifacts.
        x0 = 0
        if max_x1_px is not None:
            x1 = min(w, max_x1_px)
        else:
            x1 = w
        crop = pil_img.crop((x0, y0, x1, y1))
        bordered = PILImage.new('RGB', (crop.width + 24, crop.height + 24), (255, 255, 255))
        bordered.paste(crop, (12, 12))
        import io
        buf = io.BytesIO()
        bordered.save(buf, format='PNG')
        return base64.b64encode(buf.getvalue()).decode('utf-8')

    def extract_text_region(pdf_obj, page_num, y_start, y_end):
        """Extract text from pdfplumber char stream within y range."""
        page = pdf_obj.pages[page_num]
        chars = [c for c in page.chars if y_start <= c['top'] <= y_end]
        chars.sort(key=lambda c: (round(c['top'], 1), c['x0']))

        lines = []
        cur_y, cur_chars = None, []
        for c in chars:
            if cur_y is None or abs(c['top'] - cur_y) > 4:
                if cur_chars:
                    lines.append(''.join(ch['text'] for ch in cur_chars))
                cur_y = c['top']
                cur_chars = [c]
            else:
                cur_chars.append(c)
        if cur_chars:
            lines.append(''.join(ch['text'] for ch in cur_chars))
        return '\n'.join(lines)

    # ── Step 4–6: Build final segments ───────────────────────────────────────
    GAP = 6  # px between stacked crops

    # FIX Issue 2 (shared-page): Build an index of segment start positions on each page
    # so we can add overlapping "continued" text when a segment ends mid-page.
    # This ensures that when Part 2 questions share a page with Part 3, the
    # Part 3 segment captures the intro text that appears before its questions.
    page_seg_starts = {}  # page_num -> list of (seg_idx, y_start) sorted by y_start
    for idx, seg in enumerate(sorted(segments_raw, key=lambda s: (s['page_start'], s['y_start']))):
        pn = seg['page_start']
        if pn not in page_seg_starts:
            page_seg_starts[pn] = []
        page_seg_starts[pn].append((idx, seg['y_start']))

    # Sort each page's segment start list by y_start
    for pn in page_seg_starts:
        page_seg_starts[pn].sort(key=lambda x: x[1])

    final_segments = []
    sorted_segs = sorted(segments_raw, key=lambda s: (s['page_start'], s['y_start']))
    for idx, seg in enumerate(sorted_segs):
        page_start = seg["page_start"]
        page_end = min(seg["page_end"], page_count - 1)
        # Guard: skip segments with invalid page range
        if page_start > page_end or page_start < 0 or page_end >= page_count:
            continue

        # Guard: skip segments where y_end <= y_start (empty or inverted)
        footer_y = page_layouts[page_end]["footer_y"]
        y_end_capped = min(seg["y_end"], footer_y)
        if y_end_capped <= seg.get("y_start", 0) + 1:
            continue

        # ── Crop segment images ───────────────────────────────────────────────
        crops_pil = []
        for pnum in range(page_start, page_end + 1):
            img = pil_pages[pnum]
            s = page_scales[pnum]
            y0_px = int(seg["y_start"] * s) if pnum == page_start else 0
            y1_px = int(y_end_capped * s) if pnum == page_end else img.height
            # Column cutoff: prevent right-side answer column from appearing in crop
            col_x1_pt = page_layouts[pnum].get("col_x1_pt", 612)
            col_x1_px = int(col_x1_pt * s)
            crops_pil.append(crop_and_encode(img, y0_px, y1_px, max_x1_px=col_x1_px))

        # ── Stack crops ───────────────────────────────────────────────────────
        from PIL import Image as PILImage
        if len(crops_pil) > 1:
            # crops_pil are base64 strings — decode to PIL first
            crop_pils = []
            for b64 in crops_pil:
                from io import BytesIO
                crop_pils.append(PILImage.open(BytesIO(base64.b64decode(b64))))

            max_w = max(p.width for p in crop_pils)
            total_h = sum(p.height for p in crop_pils) + GAP * (len(crop_pils) - 1)
            canvas = PILImage.new('RGB', (max_w, total_h), (255, 255, 255))
            y_off = 0
            for cp in crop_pils:
                canvas.paste(cp, ((max_w - cp.width) // 2, y_off))
                y_off += cp.height + GAP
            import io as _io
            _buf = _io.BytesIO()
            canvas.save(_buf, format='PNG')
            stacked_b64 = base64.b64encode(_buf.getvalue()).decode('utf-8')
        else:
            stacked_b64 = crops_pil[0]

        # ── Extract text ──────────────────────────────────────────────────────
        if is_scanned:
            ocr_lines = []
            for b64 in crops_pil:
                from io import BytesIO
                img = PILImage.open(BytesIO(base64.b64decode(b64)))
                ocr_lines.extend(ocr_image(img))
            seg_text = '\n'.join(ocr_lines)
            ocr_mode = "tesseract"
            text_layer_avail = False
        else:
            with pdfplumber.open(pdf_path) as pdf:
                text_parts = []
                for pnum in range(page_start, page_end + 1):
                    ys = seg["y_start"] if pnum == page_start else 0.0
                    ye = y_end_capped if pnum == page_end else 9999.0
                    part = extract_text_region(pdf, pnum, ys, ye)
                    if part:
                        text_parts.append(part)
                seg_text = '\n'.join(text_parts)
            ocr_mode = "text_layer"
            text_layer_avail = True

        # ── FIX Issue 2 (shared-page): Add "continued from above" text ──────────
        # If this segment starts mid-page (not at top), extract text from the gap above
        # to capture instruction/context that belongs to this segment but was included
        # in the previous segment's bbox (e.g., Part 3 intro text on a shared page).
        # Only applies to text-layer extraction (OCR is unreliable for overlap text).
        if text_layer_avail and page_start == page_end and seg['y_start'] > 30:
            prev_end_y = None
            if page_start in page_seg_starts:
                for (check_idx, check_y) in page_seg_starts[page_start]:
                    if check_idx == idx:
                        break
                    prev_end_y = check_y
            # Only add overlap if there is actual gap text above this segment
            if prev_end_y is not None and prev_end_y < seg['y_start']:
                with pdfplumber.open(pdf_path) as pdf:
                    overlap_text = extract_text_region(pdf, page_start, 0.0, seg['y_start'] - MARGIN)
                    if overlap_text and overlap_text.strip():
                        seg_text = (overlap_text.strip() + '\n\n' + seg_text).strip()

        # ── Full page images (lazy) ─────────────────────────────────────────────
        full_page_imgs = []
        if not lazy_pages:
            for pnum in range(page_start, page_end + 1):
                import io as _io2
                _buf2 = _io2.BytesIO()
                pil_pages[pnum].save(_buf2, format='PNG')
                b64 = base64.b64encode(_buf2.getvalue()).decode('utf-8')
                full_page_imgs.append(b64)

        seg_id = (f"Q{seg['question_start']:02d}-{seg['question_end']:02d}"
                  if seg['question_start'] else f"Page{seg['page_start']+1}")

        final_segments.append({
            "segmentId": seg_id,
            "segmentIndex": idx,
            "part": seg["part"],
            "partLabel": f"PART {seg['part']}",
            "questionStart": seg["question_start"],
            "questionEnd": seg["question_end"],
            "questionRange": seg["question_range_label"],
            "pageRange": [page_start, page_end],
            "pdfBbox": {
                "y0": round(seg["y_start"], 2),
                "y1": round(y_end_capped, 2),
            },
            "segmentImage": stacked_b64,
            "fullPageImages": full_page_imgs,
            "text": seg_text,
            "ocrMode": ocr_mode,
            "textLayerAvailable": text_layer_avail,
            "metadata": {
                "detectionMode": seg["detection_mode"],
                "inferred": seg["inferred"],
                "footerY": round(footer_y, 2),
                "scale": round(page_scales[0], 4),
                "dpi": dpi,
                "multiPage": page_start != page_end,
                "rawPageCount": page_end - page_start + 1,
            }
        })

    # ── Full document pages (lazy) ─────────────────────────────────────────────
    full_doc_pages = []
    if lazy_pages:
        for pil in pil_pages:
            import io as _io3
            _buf3 = _io3.BytesIO()
            pil.save(_buf3, format='PNG')
            full_doc_pages.append(base64.b64encode(_buf3.getvalue()).decode('utf-8'))

    # ── FIX Issue 3 & 8 (intro page detection): Skip intro pages from segments ─────────
    # An intro page has: no PART marker, no question range marker, and contains intro signals.
    # When detected, all segments that include page 0 are excluded from the result.
    # This prevents the parser from wasting tokens on cover/intro pages that have no questions.
    def is_intro_page(page_num, page_layouts, page_scales):
        """Detect if a page is an introduction/cover page (not a question page)."""
        layout = page_layouts[page_num]
        words = layout["words"]
        page_text_lower = " ".join(w["text"] for w in words).lower()

        # Check: no PART marker
        part_markers = find_part_markers(words)
        if part_markers:
            return False

        # Check: no question range marker
        qr_markers = find_qr_markers(words)
        if qr_markers:
            return False

        # Check: has intro signals (listen carefully, IELTS Listening, time, minutes, etc.)
        # Use keyword-level matching for robustness — the cover page text varies across test editions.
        intro_keywords = [
            # Official IELTS cover page canonical text
            "candidate", "question paper", "answer sheet",
            "instructions to candidates", "information for candidates",
            "approximately", "transfer time",
            # Flexible patterns
            "listen carefully",
            "time limit",
            "time:",
            "minute",
            "record your answers",
            "sample test",
            "practice test",
            "ielts",
            "academic",
            "general training",
            "band",
            "open this question paper",
        ]
        # Count how many intro keywords match — cover pages have MANY, question pages have 0-1.
        intro_keyword_count = sum(1 for kw in intro_keywords if kw in page_text_lower)
        has_intro = intro_keyword_count >= 3

        # A page is an intro if it has NO PART/QR markers AND has intro keywords.
        # Keywords are broad enough (e.g., "candidate", "question paper") that any
        # IELTS Listening cover page will match. The PART/QR check above already
        # filters out pages with real questions.
        return has_intro

    intro_page_skip = False
    if page_count > 1 and len(final_segments) > 0:
        # Only skip page 0 if the first segment is on page 0
        first_seg = final_segments[0]
        if first_seg["pageRange"] and first_seg["pageRange"][0] == 0:
            if is_intro_page(0, page_layouts, page_scales):
                intro_page_skip = True
                pre_skip_count = len(final_segments)
                final_segments = [s for s in final_segments if s["pageRange"][0] > 0]
                post_skip_count = len(final_segments)
                sys.stderr.write(f"[extract_listening_segments] Page 0 detected as intro — skipped {pre_skip_count} segment(s), remaining: {post_skip_count}\n")

                # Fallback: if ALL segments were on page 0, rebuild from page 1
                if not final_segments:
                    sys.stderr.write(f"[extract_listening_segments] All segments were on intro page — rebuilding from page 1\n")
                    # Re-scan pages 1..page_count-1 for question markers and rebuild segments
                    rebuilt_segs = []  # local list for rebuilt segments
                    tracked_part = 1
                    for pnum in range(1, page_count):
                        for sec in sections_sorted:
                            if sec["page"] == pnum and sec["type"] == "part":
                                tracked_part = int(re.search(r'\d', sec['value']).group())
                        pwords = page_layouts[pnum]["words"]
                        pq_markers = find_qr_markers(pwords)
                        if pq_markers:
                            for m in pq_markers:
                                rebuilt_segs.append({
                                    "page": pnum, "y": pwords[m["word_idx"]]["top"],
                                    "type": "question_range",
                                    "q_start": m["q_start"], "q_end": m["q_end"],
                                    "word_idx": m["word_idx"],
                                })
                    rebuilt_sorted = sorted(rebuilt_segs, key=lambda s: (s["page"], s["y"]))
                    # Fallback: if all segments were on intro page, build simple full-page
                    # segments for all non-intro pages using text extraction only.
                    # This ensures the parser has at least SOME content to work with.
                    sys.stderr.write(f"[extract_listening_segments] Intro-only segments skipped — building text-only fallback segments for pages 1..{page_count-1}\n")
                    for pnum in range(1, page_count):
                        page_height = page_layouts[pnum]["page_h"]
                        footer_y = page_layouts[pnum]["footer_y"]
                        y_start = 0.0
                        y_end = footer_y
                        # Extract text for this page
                        text_parts = []
                        with pdfplumber.open(pdf_path) as pdf:
                            part = extract_text_region(pdf, pnum, y_start, y_end)
                            if part:
                                text_parts.append(part)
                        seg_text = '\n'.join(text_parts)
                        # Determine part number for this page
                        seg_part = 1
                        for sec in sections_sorted:
                            if sec["page"] == pnum and sec["type"] == "part":
                                seg_part = int(re.search(r'\d', sec['value']).group())
                        final_segments.append({
                            "segmentId": f"Page{pnum+1}",
                            "segmentIndex": len(final_segments),
                            "part": seg_part,
                            "partLabel": f"PART {seg_part}",
                            "questionStart": None,
                            "questionEnd": None,
                            "questionRange": f"Page {pnum + 1}",
                            "pageRange": [pnum, pnum],
                            "pdfBbox": {"y0": 0.0, "y1": round(y_end, 2)},
                            "segmentImage": "",
                            "fullPageImages": [],
                            "text": seg_text,
                            "ocrMode": "text_layer",
                            "textLayerAvailable": True,
                            "metadata": {
                                "detectionMode": "full_block",
                                "inferred": True,
                                "footerY": round(footer_y, 2),
                                "scale": round(page_scales[0], 4),
                                "dpi": dpi,
                                "multiPage": False,
                                "rawPageCount": 1,
                            }
                        })

    return {
        "success": True,
        "segments": final_segments,
        "fullDocPages": full_doc_pages,
        "pageCount": page_count,
        "segmentCount": len(final_segments),
        "metadata": {
            "scanned": is_scanned,
            "ocrMode": "mixed" if is_scanned else "text_layer",
            "dpi": dpi,
            "scale": round(page_scales[0], 4),
            "introSkipped": intro_page_skip,
        }
    }


if __name__ == "__main__":
    import argparse, sys, os

    parser = argparse.ArgumentParser()
    parser.add_argument('pdf_path')
    parser.add_argument('--listening-segments', action='store_true')
    parser.add_argument('--writing-segments', action='store_true')
    parser.add_argument('--speaking-segments', action='store_true')
    parser.add_argument('--segmenter-v2', action='store_true')
    parser.add_argument('--dpi', type=int, default=200)
    parser.add_argument('--lazy-pages', default='true')
    parser.add_argument('--extract-pages', action='store_true', help='Extract per-page data (for reading/writing/speaking parsers)')
    args = parser.parse_args()

    pdf_path = args.pdf_path

    if args.extract_pages:
        # Return per-page data (like extract_pdf) — used by reading/writing/speaking parsers
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        result = extract_pdf(pdf_path)
        result["metadata"] = result.get("metadata", {})
        result["metadata"]["strategy"] = "extract_pages"
    elif args.segmenter_v2:
        # Route to the new pdf_segmenter module
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from pdf_segmenter import extract_segments

        raw_segs = extract_segments(pdf_path, dpi=args.dpi)

        # ── Adapter: map pdf_segmenter format → listeningParser.js expected format ──
        adapted = []
        for seg in raw_segs:
            part_num = seg.get("part", 1)
            part_label = f"PART {part_num}"
            stacked = seg.get("stackedCrop") or (seg.get("crops", [None])[0] if seg.get("crops", [None])[0:] else "")
            adapted.append({
                "segmentId":     seg.get("segmentId", ""),
                "segmentIndex":  len(adapted),
                "part":          part_num,
                "partLabel":     part_label,
                "questionStart": seg.get("questionRange", [None, None])[0],
                "questionEnd":   seg.get("questionRange", [None, None])[1],
                "questionRange": seg.get("segmentId", ""),
                "pageRange":     seg.get("pageIndices", []),
                "pdfBbox": {
                    "y0": seg.get("metadata", {}).get("sectionStartY", 0),
                    "y1": seg.get("metadata", {}).get("sectionEndY", 0),
                },
                "segmentImage":  stacked or "",
                "crops":         seg.get("crops", []),
                "fullPageImages": [],
                "text":          seg.get("text", ""),
                "ocrMode":       seg.get("ocrMode", "text_layer"),
                "textLayerAvailable": seg.get("ocrMode") != "ocr",
                "metadata": {
                    "detectionMode": "explicit",
                    "inferred":      seg.get("metadata", {}).get("inferred", False),
                    "footerY":        seg.get("metadata", {}).get("footerY", 715.5),
                    "dpi":           args.dpi,
                    "multiPage":     len(seg.get("pageIndices", [])) > 1,
                    "rawPageCount":  len(seg.get("pageIndices", [])),
                }
            })

        result = {
            "success": True,
            "segments": adapted,
            "fullDocPages": [],
            "pageCount": max((seg.get("pageIndices", [0])[-1] + 1 for seg in adapted), default=0),
            "segmentCount": len(adapted),
            "metadata": {
                "strategy": "segmenter-v2",
                "scanned": False,
                "ocrMode": "text_layer",
                "dpi": args.dpi,
            }
        }
    elif args.listening_segments:
        # Route to pdf_segmenter module (segmenter v2) for correct segmentation
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from pdf_segmenter import extract_segments

        raw_segs = extract_segments(pdf_path, dpi=args.dpi)

        # ── Adapter: map pdf_segmenter format → listeningParser.js expected format ──
        # Multi-page segments are expanded into one entry per page/crop.
        adapted = []
        for seg in raw_segs:
            part_num = seg.get("part", 1)
            part_label = f"PART {part_num}"
            crops = seg.get("crops", [])
            q_range = seg.get("questionRange", [None, None])
            metadata = seg.get("metadata", {})

            if len(crops) > 1:
                # Multi-page: one entry per page/crop
                for idx, (crop_b64, page_idx) in enumerate(zip(crops, seg.get("pageIndices", []))):
                    crop_label = f"{seg.get('segmentId', '')}_p{page_idx+1}" if seg.get("segmentId") else f"crop_{page_idx}"
                    adapted.append({
                        "segmentId":     crop_label,
                        "segmentIndex":  len(adapted),
                        "part":          part_num,
                        "partLabel":     part_label,
                        "questionStart": q_range[0],
                        "questionEnd":   q_range[1],
                        "questionRange": seg.get("segmentId", ""),
                        "pageRange":     [page_idx],
                        "pdfBbox": {
                            "y0": metadata.get("sectionStartY", 0),
                            "y1": metadata.get("sectionEndY", 0),
                        },
                        "segmentImage":  crop_b64 or "",
                        "crops":         [crop_b64],
                        "fullPageImages": [],
                        # Keep text on FIRST entry (idx=0); subsequent pages only carry image.
                        "text":          seg.get("text", "") if idx == 0 else "",
                        "ocrMode":       seg.get("ocrMode", "text_layer"),
                        "textLayerAvailable": seg.get("ocrMode") != "ocr",
                        "metadata": {
                            "detectionMode": "explicit",
                            "inferred":      metadata.get("inferred", False),
                            "footerY":       metadata.get("footerY", 715.5),
                            "dpi":           args.dpi,
                            "multiPage":     True,
                            "rawPageCount":  len(crops),
                            "pageIndex":     page_idx,
                        }
                    })
            else:
                # Single-page
                crop_b64 = crops[0] if crops else ""
                adapted.append({
                    "segmentId":     seg.get("segmentId", ""),
                    "segmentIndex":  len(adapted),
                    "part":          part_num,
                    "partLabel":     part_label,
                    "questionStart": q_range[0],
                    "questionEnd":   q_range[1],
                    "questionRange": seg.get("segmentId", ""),
                    "pageRange":     seg.get("pageIndices", []),
                    "pdfBbox": {
                        "y0": metadata.get("sectionStartY", 0),
                        "y1": metadata.get("sectionEndY", 0),
                    },
                    "segmentImage":  crop_b64 or "",
                    "crops":         crops,
                    "fullPageImages": [],
                    "text":          seg.get("text", ""),
                    "ocrMode":       seg.get("ocrMode", "text_layer"),
                    "textLayerAvailable": seg.get("ocrMode") != "ocr",
                    "metadata": {
                        "detectionMode": "explicit",
                        "inferred":      metadata.get("inferred", False),
                        "footerY":       metadata.get("footerY", 715.5),
                        "dpi":           args.dpi,
                        "multiPage":     False,
                        "rawPageCount":  1,
                        "pageIndex":     seg.get("pageIndices", [0])[0],
                    }
                })

        result = {
            "success": True,
            "segments": adapted,
            "fullDocPages": [],
            "pageCount": max((seg.get("pageIndices", [0])[-1] + 1 for seg in adapted), default=0),
            "segmentCount": len(adapted),
            "metadata": {
                "strategy": "segmenter-v2",
                "scanned": False,
                "ocrMode": "text_layer",
                "dpi": args.dpi,
            }
        }
    elif args.writing_segments:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from pdf_segmenter import extract_generic_segments

        raw_segs = extract_generic_segments(pdf_path, section_type='writing', dpi=args.dpi)

        adapted = []
        for seg in raw_segs:
            stacked = seg.get("stackedCrop") or (seg.get("crops", [None])[0] if seg.get("crops", [None])[0:] else "")
            adapted.append({
                "segmentId":      seg.get("segmentId", ""),
                "segmentIndex":   len(adapted),
                "sectionLabel":   seg.get("sectionLabel", ""),
                "sectionNumber":  seg.get("sectionNumber", 1),
                "pageRange":      seg.get("pageIndices", []),
                "crops":          seg.get("crops", []),
                "stackedCrop":    seg.get("stackedCrop", ""),
                "segmentImage":   stacked,
                "text":           seg.get("text", ""),
                "ocrMode":        seg.get("ocrMode", "text_layer"),
                "textLayerAvailable": seg.get("ocrMode") != "ocr",
                "metadata": {
                    "sectionType":   "writing",
                    "sectionStartY": seg.get("metadata", {}).get("sectionStartY", 0),
                    "sectionEndY":   seg.get("metadata", {}).get("sectionEndY", 0),
                    "footerY":       seg.get("metadata", {}).get("footerY", 715.5),
                    "dpi":           args.dpi,
                    "isScanned":     seg.get("metadata", {}).get("isScanned", False),
                }
            })

        result = {
            "success": True,
            "segments": adapted,
            "fullDocPages": [],
            "pageCount": max((seg.get("pageIndices", [0])[-1] + 1 for seg in raw_segs), default=0),
            "segmentCount": len(adapted),
            "metadata": {
                "strategy": "writing-segments",
                "sectionType": "writing",
                "scanned": False,
                "ocrMode": "text_layer",
                "dpi": args.dpi,
            }
        }

    elif args.speaking_segments:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        from pdf_segmenter import extract_generic_segments

        raw_segs = extract_generic_segments(pdf_path, section_type='speaking', dpi=args.dpi)

        adapted = []
        for seg in raw_segs:
            stacked = seg.get("stackedCrop") or (seg.get("crops", [None])[0] if seg.get("crops", [None])[0:] else "")
            adapted.append({
                "segmentId":      seg.get("segmentId", ""),
                "segmentIndex":   len(adapted),
                "sectionLabel":   seg.get("sectionLabel", ""),
                "sectionNumber":  seg.get("sectionNumber", 1),
                "pageRange":      seg.get("pageIndices", []),
                "crops":          seg.get("crops", []),
                "stackedCrop":    seg.get("stackedCrop", ""),
                "segmentImage":   stacked,
                "text":           seg.get("text", ""),
                "ocrMode":        seg.get("ocrMode", "text_layer"),
                "textLayerAvailable": seg.get("ocrMode") != "ocr",
                "metadata": {
                    "sectionType":   "speaking",
                    "sectionStartY": seg.get("metadata", {}).get("sectionStartY", 0),
                    "sectionEndY":   seg.get("metadata", {}).get("sectionEndY", 0),
                    "footerY":       seg.get("metadata", {}).get("footerY", 715.5),
                    "dpi":           args.dpi,
                    "isScanned":     seg.get("metadata", {}).get("isScanned", False),
                }
            })

        result = {
            "success": True,
            "segments": adapted,
            "fullDocPages": [],
            "pageCount": max((seg.get("pageIndices", [0])[-1] + 1 for seg in raw_segs), default=0),
            "segmentCount": len(adapted),
            "metadata": {
                "strategy": "speaking-segments",
                "sectionType": "speaking",
                "scanned": False,
                "ocrMode": "text_layer",
                "dpi": args.dpi,
            }
        }

    else:
        result = extract_pdf(pdf_path)

    print(json.dumps(result), flush=True)