const { Lesson, Unit } = require("../models");

const generateLessonsForUnit = (unitId, unitNumber) => {
  return [
    {
      unit_id: unitId,
      title: `Lesson 1`,
      type: "vocabulary",
      order_index: 1,
    },
    {
      unit_id: unitId,
      title: `Lesson 2`,
      type: "vocabulary",
      order_index: 2,
    },
    {
      unit_id: unitId,
      title: `Lesson 3`,
      type: "practice",
      order_index: 3,
    },
    {
      unit_id: unitId,
      title: `Lesson 4`,
      type: "practice",
      order_index: 4,
    },
    {
      unit_id: unitId,
      title: `Unit ${unitNumber} Test`,
      type: "test",
      order_index: 5,
    },
  ];
};

const seedLessons = async () => {
  try {
    console.log(" Seeding lessons...");

    const units = await Unit.findAll({ order: [["order_index", "ASC"]] });

    if (units.length === 0) {
      console.log("⚠️  No units found. Please seed units first.");
      return;
    }

    await Lesson.destroy({ where: {}, truncate: true, cascade: true });

    const allLessons = [];
    units.forEach((unit) => {
      const lessons = generateLessonsForUnit(unit.id, unit.order_index);
      allLessons.push(...lessons);
    });

    const lessons = await Lesson.bulkCreate(allLessons);

    console.log(` Successfully seeded ${lessons.length} lessons!`);
    return lessons;
  } catch (error) {
    console.error(" Error seeding lessons:", error);
    throw error;
  }
};

module.exports = seedLessons;
