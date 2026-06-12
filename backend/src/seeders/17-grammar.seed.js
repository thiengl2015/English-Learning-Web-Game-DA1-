const { Grammar, Unit, Lesson } = require("../models");

// Grammar grouped by type, attached to the first lesson of the first units.
// "Ngữ pháp đã học" is derived from completed lessons, so grammar on lessons the
// seeded test user has completed will appear in that tab automatically.
const GRAMMAR_BY_UNIT_ORDER = {
  1: [
    {
      grammar_type: "Thì (Tenses)",
      name: "Present Simple",
      formula: "S + V(s/es) + O",
      explanation: "Diễn tả thói quen, sự thật hiển nhiên ở hiện tại.",
      example: "She works in a hospital every day.",
    },
    {
      grammar_type: "Động từ to be",
      name: "Verb to be (am / is / are)",
      formula: "S + am/is/are + (N/Adj)",
      explanation: "Dùng để giới thiệu, mô tả người hoặc vật.",
      example: "I am a student. They are happy.",
    },
  ],
  2: [
    {
      grammar_type: "Thì (Tenses)",
      name: "Present Continuous",
      formula: "S + am/is/are + V-ing",
      explanation: "Diễn tả hành động đang xảy ra ngay lúc nói.",
      example: "They are playing football now.",
    },
    {
      grammar_type: "Mạo từ (Articles)",
      name: "A / An / The",
      formula: "a/an/the + N",
      explanation: "Mạo từ không xác định (a/an) và xác định (the).",
      example: "I have an apple and the apple is red.",
    },
  ],
  3: [
    {
      grammar_type: "Thì (Tenses)",
      name: "Past Simple",
      formula: "S + V2/V-ed + O",
      explanation: "Diễn tả hành động đã xảy ra và kết thúc trong quá khứ.",
      example: "He visited Hanoi last year.",
    },
    {
      grammar_type: "So sánh (Comparison)",
      name: "Comparative",
      formula: "S + be + adj-er / more adj + than ...",
      explanation: "So sánh hơn giữa hai người hoặc hai vật.",
      example: "She is taller than her brother.",
    },
  ],
};

const seedGrammar = async () => {
  try {
    console.log("📦 Seeding grammar...");

    await Grammar.destroy({ where: {}, force: true });

    const units = await Unit.findAll({ order: [["order_index", "ASC"]] });
    if (units.length === 0) {
      console.log("⚠️  No units found. Please seed units first.");
      return;
    }

    const rows = [];
    for (const unit of units) {
      const items = GRAMMAR_BY_UNIT_ORDER[unit.order_index];
      if (!items) continue;
      const lesson = await Lesson.findOne({
        where: { unit_id: unit.id },
        order: [["order_index", "ASC"]],
      });
      if (!lesson) continue;
      items.forEach((it, idx) => {
        rows.push({
          unit_id: unit.id,
          lesson_id: lesson.id,
          grammar_type: it.grammar_type,
          name: it.name,
          formula: it.formula,
          pattern: it.formula,
          explanation: it.explanation,
          example: it.example,
          order_index: idx,
        });
      });
    }

    if (rows.length) {
      await Grammar.bulkCreate(rows);
    }

    console.log(` Successfully seeded ${rows.length} grammar items!`);
    return rows;
  } catch (error) {
    console.error(" Error seeding grammar:", error);
    throw error;
  }
};

module.exports = seedGrammar;
