-- Extend the grammar table to match the practice/grammar structure:
-- name (tên), formula (công thức), grammar_type (loại ngữ pháp, for grouping).
-- explanation is reused as "cách dùng" (usage); example as "ví dụ minh hoạ".

ALTER TABLE grammar
  ADD COLUMN grammar_type VARCHAR(120) NULL AFTER lesson_id,
  ADD COLUMN name VARCHAR(255) NULL AFTER grammar_type,
  ADD COLUMN formula VARCHAR(500) NULL AFTER name;

-- Backfill name/formula from the legacy pattern column for existing rows.
UPDATE grammar SET name = pattern WHERE name IS NULL;
UPDATE grammar SET formula = pattern WHERE formula IS NULL;
UPDATE grammar SET grammar_type = 'General' WHERE grammar_type IS NULL OR grammar_type = '';

CREATE INDEX idx_grammar_type ON grammar (grammar_type);
