-- Admin-authored game content for each game_config row.
-- When content is NULL the game falls back to auto-generation from vocabulary.

ALTER TABLE game_config
  ADD COLUMN content JSON NULL
  COMMENT 'Admin-authored game items (shape depends on game_type). NULL = auto-generate from vocabulary.';
