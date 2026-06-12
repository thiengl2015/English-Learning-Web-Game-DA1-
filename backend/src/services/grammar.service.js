const { Grammar, Unit, Lesson, LessonProgress } = require("../models");
const { Op } = require("sequelize");

class GrammarService {
  // Lesson ids the user has completed — a grammar item is "đã học" if its
  // lesson is completed (derive, no separate user_grammar table).
  async getCompletedLessonIds(userId) {
    if (!userId) return new Set();
    const rows = await LessonProgress.findAll({
      where: { user_id: userId, status: "completed" },
      attributes: ["lesson_id"],
    });
    return new Set(rows.map((r) => r.lesson_id));
  }

  serialize(g, completedLessonIds) {
    const data = g.toJSON ? g.toJSON() : g;
    return {
      id: data.id,
      grammar_type: data.grammar_type || "General",
      name: data.name || data.pattern || "",
      formula: data.formula || data.pattern || "",
      usage: data.explanation || "",
      example: data.example || "",
      translation: data.translation || "",
      unit: data.unit
        ? { id: data.unit.id, title: data.unit.title, icon: data.unit.icon }
        : null,
      lesson: data.lesson ? { id: data.lesson.id, title: data.lesson.title } : null,
      is_learned: completedLessonIds.has(data.lesson_id),
    };
  }

  async getAllGrammar(userId) {
    const [grammar, completedLessonIds] = await Promise.all([
      Grammar.findAll({
        include: [
          { model: Unit, as: "unit", attributes: ["id", "title", "icon"] },
          { model: Lesson, as: "lesson", attributes: ["id", "title"] },
        ],
        order: [
          ["grammar_type", "ASC"],
          ["unit_id", "ASC"],
          ["order_index", "ASC"],
          ["id", "ASC"],
        ],
      }),
      this.getCompletedLessonIds(userId),
    ]);

    return grammar.map((g) => this.serialize(g, completedLessonIds));
  }

  async getLearnedGrammar(userId) {
    const completedLessonIds = await this.getCompletedLessonIds(userId);
    if (completedLessonIds.size === 0) return [];

    const grammar = await Grammar.findAll({
      where: { lesson_id: { [Op.in]: Array.from(completedLessonIds) } },
      include: [
        { model: Unit, as: "unit", attributes: ["id", "title", "icon"] },
        { model: Lesson, as: "lesson", attributes: ["id", "title"] },
      ],
      order: [
        ["unit_id", "ASC"],
        ["order_index", "ASC"],
        ["id", "ASC"],
      ],
    });

    return grammar.map((g) => this.serialize(g, completedLessonIds));
  }
}

module.exports = new GrammarService();
