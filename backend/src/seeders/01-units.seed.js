const { Unit } = require("../models");

const unitsData = [
  {
    title: "Unit 1",
    subtitle: "Greetings & Basic Introductions",
    icon: "👋",
    order_index: 1,
    total_lessons: 5,
  },
  {
    title: "Unit 2",
    subtitle: "Family & Relationships",
    icon: "👨‍👩‍👧‍👦",
    order_index: 2,
    total_lessons: 5,
  },
  {
    title: "Unit 3",
    subtitle: "Daily Activities & Routines",
    icon: "🏃",
    order_index: 3,
    total_lessons: 5,
  },
  {
    title: "Unit 4",
    subtitle: "Food & Drinks",
    icon: "🍕",
    order_index: 4,
    total_lessons: 5,
  },
  {
    title: "Unit 5",
    subtitle: "Shopping & Money",
    icon: "🛒",
    order_index: 5,
    total_lessons: 5,
  },
  {
    title: "Unit 6",
    subtitle: "Travel & Transportation",
    icon: "✈️",
    order_index: 6,
    total_lessons: 5,
  },
  {
    title: "Unit 7",
    subtitle: "Weather & Seasons",
    icon: "🌤️",
    order_index: 7,
    total_lessons: 5,
  },
  {
    title: "Unit 8",
    subtitle: "Home & Living",
    icon: "🏠",
    order_index: 8,
    total_lessons: 5,
  },
  {
    title: "Unit 9",
    subtitle: "Work & Career",
    icon: "💼",
    order_index: 9,
    total_lessons: 5,
  },
  {
    title: "Unit 10",
    subtitle: "Health & Fitness",
    icon: "💪",
    order_index: 10,
    total_lessons: 5,
  },
  {
    title: "Unit 11",
    subtitle: "Technology & Internet",
    icon: "💻",
    order_index: 11,
    total_lessons: 5,
  },
  {
    title: "Unit 12",
    subtitle: "Entertainment & Hobbies",
    icon: "🎮",
    order_index: 12,
    total_lessons: 5,
  },
];

const seedUnits = async () => {
  try {
    console.log(" Seeding units...");

    await Unit.destroy({ where: {}, truncate: true, cascade: true });

    const units = await Unit.bulkCreate(unitsData);

    console.log(` Successfully seeded ${units.length} units!`);
    return units;
  } catch (error) {
    console.error(" Error seeding units:", error);
    throw error;
  }
};

module.exports = seedUnits;
