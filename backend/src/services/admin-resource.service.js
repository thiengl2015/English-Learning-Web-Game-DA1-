const {
  sequelize,
  Unit,
  Lesson,
  Vocabulary,
  Grammar,
  GameConfig,
} = require("../models");

const badRequest = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
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
        .map((l) => ({
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
              pattern: g.pattern,
              explanation: g.explanation,
              example: g.example,
              translation: g.translation,
            })),
          games: games
            .filter((gc) => gc.lesson_id === l.id)
            .map((gc) => ({
              id: gc.id,
              game_type: gc.game_type,
              questions_count: gc.questions_count,
              has_content: Array.isArray(gc.content) && gc.content.length > 0,
            })),
        })),
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
          .filter((it) => it && it.pattern && it.pattern.trim())
          .map((it, idx) => ({
            unit_id: unitRow.id,
            lesson_id: lessonRow.id,
            pattern: it.pattern.trim(),
            explanation: it.explanation || null,
            example: it.example || null,
            translation: it.translation || null,
            order_index: baseOrder + idx,
          }));
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
          where: { lesson_id: lessonRow.id, game_type: game.type },
          transaction: t,
        });
        if (cfg) {
          await cfg.update(fields, { transaction: t });
        } else {
          cfg = await GameConfig.create(fields, { transaction: t });
        }
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
}

module.exports = new AdminResourceService();
