const {
  sequelize,
  Unit,
  Lesson,
  Vocabulary,
  Grammar,
  GameConfig,
} = require("../models");
const { Op } = require("sequelize");
const {
  GAME_DEFAULTS,
  GAME_TYPES,
  hasAuthoredGameContent,
  isGameTypeAllowedForLesson,
  pickPrimaryLessonGameConfig,
} = require("../utils/lesson-game.util");
const { isCloudinaryUrl } = require("../config/cloudinary");

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

const hasGameContent = hasAuthoredGameContent;

const normalizeCloudinaryMediaUrl = (value, fieldName) => {
  const mediaUrl = typeof value === "string" ? value.trim() : value;
  if (!mediaUrl) return null;
  if (isCloudinaryUrl(mediaUrl)) return mediaUrl;
  throw badRequest(`${fieldName} must be uploaded to Cloudinary before saving`);
};

const normalizeGameMedia = (item) => {
  if (!item || typeof item !== "object") return item;
  const next = { ...item };
  for (const key of ["imageUrl", "image_url", "audioUrl", "audio_url"]) {
    if (Object.prototype.hasOwnProperty.call(next, key)) {
      next[key] = normalizeCloudinaryMediaUrl(next[key], `Game ${key}`);
    }
  }
  return next;
};

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
      order_index: l.order_index,
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
          const primaryGame = pickPrimaryLessonGameConfig(
            games.filter((gc) => gc.lesson_id === l.id),
            l,
            u
          );

          return {
            id: l.id,
            unit_id: l.unit_id,
            title: l.title,
            type: l.type,
            order_index: l.order_index,
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
            image_url: normalizeCloudinaryMediaUrl(
              it.imageUrl || it.image_url,
              "Vocabulary image"
            ),
            audio_url: normalizeCloudinaryMediaUrl(
              it.audioUrl || it.audio_url,
              "Vocabulary audio"
            ),
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
        if (!isGameTypeAllowedForLesson(lessonRow, game.type)) {
          throw badRequest(
            lessonRow.order_index === 5 || lessonRow.type === "test"
              ? "Lesson 5/test must use Signal Check"
              : "Lessons 1-4 must use Galaxy Match, Planetary Order, Rescue Mission, or Voice Command"
          );
        }
        const data = Array.isArray(game.data)
          ? game.data.filter(Boolean).map(normalizeGameMedia)
          : [];
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
          questions_count:
            game.type === "galaxy-match"
              ? Math.min(defaults.questions_count, data.length)
              : data.length,
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
    if (Object.prototype.hasOwnProperty.call(fields, "image_url")) {
      fields.image_url = normalizeCloudinaryMediaUrl(
        fields.image_url,
        "Vocabulary image"
      );
    }
    if (Object.prototype.hasOwnProperty.call(fields, "audio_url")) {
      fields.audio_url = normalizeCloudinaryMediaUrl(
        fields.audio_url,
        "Vocabulary audio"
      );
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
