const {
  sequelize,
  Unit,
  Lesson,
  Vocabulary,
  Grammar,
  GameConfig,
} = require("../models");
const { Op } = require("sequelize");

const badRequest = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};

const notFound = (message) => {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
};

// Per game-type config defaults (mirror seeders/04-games.seed.js).
const GAME_DEFAULTS = {
  "galaxy-match": { difficulty: "easy", time_limit: 120, passing_score: 70, xp_reward: 50 },
  "planetary-order": { difficulty: "medium", time_limit: 180, passing_score: 75, xp_reward: 75 },
  "rescue-mission": { difficulty: "medium", time_limit: 150, passing_score: 70, xp_reward: 60 },
  "signal-check": { difficulty: "hard", time_limit: 120, passing_score: 80, xp_reward: 100 },
  "voice-command": { difficulty: "medium", time_limit: 360, passing_score: 70, xp_reward: 80 },
};

const GAME_TYPES = Object.keys(GAME_DEFAULTS);

const parseMaybeJson = (value) => {
  if (Array.isArray(value) || value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

const hasGameContent = (value) => {
  const parsed = parseMaybeJson(value);
  return Array.isArray(parsed) && parsed.filter(Boolean).length > 0;
};

const pickPrimaryGameConfig = (configs) =>
  [...configs].sort((a, b) => {
    const authoredDiff =
      Number(hasGameContent(b.content)) - Number(hasGameContent(a.content));
    if (authoredDiff !== 0) return authoredDiff;

    return Number(b.id) - Number(a.id);
  })[0] || null;

class AdminResourceService {
  async getUnits() {
    const units = await Unit.findAll({
      order: [
        ["order_index", "ASC"],
        ["id", "ASC"],
      ],
    });
    return units.map((u) => ({
      id: u.id,
      title: u.title,
      subtitle: u.subtitle,
      icon: u.icon,
      order_index: u.order_index,
    }));
  }

  async getLessons(unitId) {
    const lessons = await Lesson.findAll({
      where: { unit_id: unitId },
      order: [
        ["order_index", "ASC"],
        ["id", "ASC"],
      ],
    });
    return lessons.map((l) => ({
      id: l.id,
      unitId: l.unit_id,
      title: l.title,
      contentType: l.type,
    }));
  }

  // Full units -> lessons -> vocab/grammar/games tree for the manager view.
  async getTree() {
    const [units, lessons, vocab, grammar, games] = await Promise.all([
      Unit.findAll({ order: [["order_index", "ASC"], ["id", "ASC"]] }),
      Lesson.findAll({ order: [["order_index", "ASC"], ["id", "ASC"]] }),
      Vocabulary.findAll({ order: [["id", "ASC"]] }),
      Grammar.findAll({ order: [["order_index", "ASC"], ["id", "ASC"]] }),
      GameConfig.findAll(),
    ]);

    return units.map((u) => ({
      id: u.id,
      title: u.title,
      subtitle: u.subtitle,
      icon: u.icon,
      order_index: u.order_index,
      lessons: lessons
        .filter((l) => l.unit_id === u.id)
        .map((l) => {
          const primaryGame = pickPrimaryGameConfig(
            games.filter((gc) => gc.lesson_id === l.id)
          );

          return {
            id: l.id,
            unit_id: l.unit_id,
            title: l.title,
            type: l.type,
            vocabulary: vocab
              .filter((v) => v.lesson_id === l.id)
              .map((v) => ({
                id: v.id,
                word: v.word,
                phonetic: v.phonetic,
                translation: v.translation,
                image_url: v.image_url,
                audio_url: v.audio_url,
              })),
            grammar: grammar
              .filter((g) => g.lesson_id === l.id)
              .map((g) => ({
                id: g.id,
                grammar_type: g.grammar_type,
                name: g.name,
                formula: g.formula,
                pattern: g.pattern,
                explanation: g.explanation,
                example: g.example,
                translation: g.translation,
              })),
            games: primaryGame
              ? [
                  {
                    id: primaryGame.id,
                    game_type: primaryGame.game_type,
                    questions_count: primaryGame.questions_count,
                    has_content: hasGameContent(primaryGame.content),
                  },
                ]
              : [],
          };
        }),
    }));
  }

  /**
   * Transactional upload: unit -> lesson -> vocabulary|grammar -> game content.
   * payload: { unit, lesson, contentType, content[], game: { type, data[] } }
   */
  async createResource(payload) {
    const { unit, lesson, game } = payload || {};
    const contentType =
      payload?.contentType || lesson?.contentType || "vocabulary";
    const content = Array.isArray(payload?.content) ? payload.content : [];

    if (!unit) throw badRequest("Thiếu thông tin unit");
    if (!lesson) throw badRequest("Thiếu thông tin lesson");

    return sequelize.transaction(async (t) => {
      // 1) Unit
      let unitRow;
      if (unit.id) {
        unitRow = await Unit.findByPk(unit.id, { transaction: t });
        if (!unitRow) throw badRequest("Unit không tồn tại");
      } else {
        if (!unit.title || !unit.title.trim()) {
          throw badRequest("Tên unit không được để trống");
        }
        const maxOrder = (await Unit.max("order_index", { transaction: t })) || 0;
        unitRow = await Unit.create(
          {
            title: unit.title.trim(),
            subtitle: unit.subtitle || null,
            icon: unit.icon || null,
            order_index: maxOrder + 1,
            total_lessons: 0,
          },
          { transaction: t }
        );
      }

      // 2) Lesson
      let lessonRow;
      if (lesson.id) {
        lessonRow = await Lesson.findByPk(lesson.id, { transaction: t });
        if (lessonRow && lessonRow.unit_id !== unitRow.id) {
          throw badRequest("Lesson khÃ´ng thuá»™c unit Ä‘Ã£ chá»n");
        }
        if (!lessonRow) throw badRequest("Lesson không tồn tại");
      } else {
        if (!lesson.title || !lesson.title.trim()) {
          throw badRequest("Tên lesson không được để trống");
        }
        const type = contentType === "grammar" ? "grammar" : "vocabulary";
        const maxOrder =
          (await Lesson.max("order_index", {
            where: { unit_id: unitRow.id },
            transaction: t,
          })) || 0;
        lessonRow = await Lesson.create(
          {
            unit_id: unitRow.id,
            title: lesson.title.trim(),
            type,
            order_index: maxOrder + 1,
          },
          { transaction: t }
        );
        const lessonCount = await Lesson.count({
          where: { unit_id: unitRow.id },
          transaction: t,
        });
        await unitRow.update({ total_lessons: lessonCount }, { transaction: t });
      }

      // 3) Content (vocabulary or grammar)
      let createdVocabulary = 0;
      let createdGrammar = 0;

      if (contentType === "grammar") {
        const baseOrder = await Grammar.count({
          where: { lesson_id: lessonRow.id },
          transaction: t,
        });
        const rows = content
          .map((it) => {
            if (!it) return null;
            // Accept new structure (name/formula/usage) and legacy (pattern/explanation).
            const name = (it.name || "").trim();
            const formula = (it.formula || it.pattern || "").trim();
            const usage = it.usage || it.explanation || null;
            // pattern is NOT NULL; keep it populated for legacy reads.
            const pattern = (formula || name).trim();
            if (!name && !pattern) return null;
            return {
              unit_id: unitRow.id,
              lesson_id: lessonRow.id,
              grammar_type: (it.grammarType || it.grammar_type || "General").trim() || "General",
              name: name || null,
              formula: formula || null,
              pattern,
              explanation: usage,
              example: it.example || null,
              translation: it.translation || null,
            };
          })
          .filter(Boolean)
          .map((row, idx) => ({ ...row, order_index: baseOrder + idx }));
        if (rows.length) {
          await Grammar.bulkCreate(rows, { transaction: t });
          createdGrammar = rows.length;
        }
      } else {
        const rows = content
          .filter((it) => it && it.word && it.word.trim() && it.translation && it.translation.trim())
          .map((it) => ({
            unit_id: unitRow.id,
            lesson_id: lessonRow.id,
            word: it.word.trim(),
            phonetic: it.phonetic || null,
            translation: it.translation.trim(),
            image_url: it.imageUrl || it.image_url || null,
            audio_url: it.audioUrl || it.audio_url || null,
          }));
        if (rows.length) {
          await Vocabulary.bulkCreate(rows, { transaction: t });
          createdVocabulary = rows.length;
        }
      }

      // 4) Game content
      let gameConfigId = null;
      if (game && game.type) {
        if (!GAME_TYPES.includes(game.type)) {
          throw badRequest(`Loại game không hợp lệ: ${game.type}`);
        }
        const data = Array.isArray(game.data) ? game.data.filter(Boolean) : [];
        if (data.length === 0) {
          throw badRequest("Nội dung game không được để trống");
        }
        const defaults = GAME_DEFAULTS[game.type];
        const fields = {
          unit_id: unitRow.id,
          lesson_id: lessonRow.id,
          game_type: game.type,
          difficulty: defaults.difficulty,
          time_limit: defaults.time_limit,
          passing_score: defaults.passing_score,
          xp_reward: defaults.xp_reward,
          questions_count: data.length,
          content: data,
        };
        let cfg = await GameConfig.findOne({
          where: { lesson_id: lessonRow.id },
          order: [
            ["updated_at", "DESC"],
            ["id", "DESC"],
          ],
          transaction: t,
        });
        if (cfg) {
          await cfg.update(fields, { transaction: t });
        } else {
          cfg = await GameConfig.create(fields, { transaction: t });
        }
        await GameConfig.destroy({
          where: {
            lesson_id: lessonRow.id,
            id: { [Op.ne]: cfg.id },
          },
          transaction: t,
        });
        gameConfigId = cfg.id;
      }

      return {
        unit_id: unitRow.id,
        lesson_id: lessonRow.id,
        lesson_type: lessonRow.type,
        created_vocabulary: createdVocabulary,
        created_grammar: createdGrammar,
        game_config_id: gameConfigId,
      };
    });
  }

  // ── Manage (edit / delete). DB FKs cascade child rows on delete. ──

  async updateUnit(id, body) {
    const unit = await Unit.findByPk(id);
    if (!unit) throw notFound("Unit không tồn tại");
    const fields = {};
    if (body.title !== undefined) fields.title = body.title;
    if (body.subtitle !== undefined) fields.subtitle = body.subtitle;
    if (body.icon !== undefined) fields.icon = body.icon;
    await unit.update(fields);
    return { id: unit.id };
  }

  async deleteUnit(id) {
    const count = await Unit.destroy({ where: { id } });
    if (!count) throw notFound("Unit không tồn tại");
    return { id: Number(id) };
  }

  async updateLesson(id, body) {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) throw notFound("Lesson không tồn tại");
    const fields = {};
    if (body.title !== undefined) fields.title = body.title;
    if (body.type !== undefined) {
      if (!["vocabulary", "practice", "test", "grammar"].includes(body.type)) {
        throw badRequest("Loại lesson không hợp lệ");
      }
      fields.type = body.type;
    }
    await lesson.update(fields);
    return { id: lesson.id };
  }

  async deleteLesson(id) {
    const count = await Lesson.destroy({ where: { id } });
    if (!count) throw notFound("Lesson không tồn tại");
    return { id: Number(id) };
  }

  async updateVocabulary(id, body) {
    const vocab = await Vocabulary.findByPk(id);
    if (!vocab) throw notFound("Từ vựng không tồn tại");
    const fields = {};
    for (const key of ["word", "phonetic", "translation", "image_url", "audio_url"]) {
      if (body[key] !== undefined) fields[key] = body[key];
    }
    await vocab.update(fields);
    return { id: vocab.id };
  }

  async deleteVocabulary(id) {
    const count = await Vocabulary.destroy({ where: { id } });
    if (!count) throw notFound("Từ vựng không tồn tại");
    return { id: Number(id) };
  }

  async updateGrammar(id, body) {
    const grammar = await Grammar.findByPk(id);
    if (!grammar) throw notFound("Ngữ pháp không tồn tại");
    const fields = {};
    for (const key of [
      "grammar_type",
      "name",
      "formula",
      "pattern",
      "explanation",
      "example",
      "translation",
    ]) {
      if (body[key] !== undefined) fields[key] = body[key];
    }
    // pattern is NOT NULL and auto-derived (FE never sends it). Whenever name or
    // formula is part of the update, re-derive pattern so it never goes empty.
    if (fields.pattern === undefined && ("name" in fields || "formula" in fields)) {
      const nextFormula = fields.formula !== undefined ? fields.formula : grammar.formula;
      const nextName = fields.name !== undefined ? fields.name : grammar.name;
      fields.pattern = ((nextFormula || nextName || grammar.pattern || "") + "").trim();
    }
    await grammar.update(fields);
    return { id: grammar.id };
  }

  async deleteGrammar(id) {
    const count = await Grammar.destroy({ where: { id } });
    if (!count) throw notFound("Ngữ pháp không tồn tại");
    return { id: Number(id) };
  }

  async deleteGame(id) {
    const count = await GameConfig.destroy({ where: { id } });
    if (!count) throw notFound("Game không tồn tại");
    return { id: Number(id) };
  }
}

module.exports = new AdminResourceService();
