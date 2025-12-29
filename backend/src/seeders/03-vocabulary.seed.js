const { Vocabulary, Unit, Lesson, sequelize } = require("../models");

const unit1Vocabulary = [
  { word: "Hello", phonetic: "/həˈloʊ/", translation: "Xin chào" },
  { word: "Goodbye", phonetic: "/ɡʊdˈbaɪ/", translation: "Tạm biệt" },
  { word: "Please", phonetic: "/pliːz/", translation: "Làm ơn" },
  { word: "Thank you", phonetic: "/θæŋk juː/", translation: "Cảm ơn" },
  { word: "Sorry", phonetic: "/ˈsɒri/", translation: "Xin lỗi" },
  { word: "Yes", phonetic: "/jes/", translation: "Có/Vâng" },
  { word: "No", phonetic: "/noʊ/", translation: "Không" },
  {
    word: "Excuse me",
    phonetic: "/ɪkˈskjuːz miː/",
    translation: "Xin lỗi (để qua)",
  },
  { word: "Welcome", phonetic: "/ˈwelkəm/", translation: "Chào mừng" },
  {
    word: "Good morning",
    phonetic: "/ɡʊd ˈmɔːrnɪŋ/",
    translation: "Chào buổi sáng",
  },

  { word: "Name", phonetic: "/neɪm/", translation: "Tên" },
  { word: "My", phonetic: "/maɪ/", translation: "Của tôi" },
  { word: "Your", phonetic: "/jɔːr/", translation: "Của bạn" },
  { word: "Nice", phonetic: "/naɪs/", translation: "Tốt đẹp" },
  { word: "Meet", phonetic: "/miːt/", translation: "Gặp" },
  { word: "I", phonetic: "/aɪ/", translation: "Tôi" },
  { word: "You", phonetic: "/juː/", translation: "Bạn" },
  { word: "Am", phonetic: "/æm/", translation: "Là (I am)" },
  { word: "Are", phonetic: "/ɑːr/", translation: "Là (you are)" },
  { word: "From", phonetic: "/frɒm/", translation: "Từ" },
];

const unit2Vocabulary = [
  { word: "Family", phonetic: "/ˈfæməli/", translation: "Gia đình" },
  { word: "Father", phonetic: "/ˈfɑːðər/", translation: "Bố" },
  { word: "Mother", phonetic: "/ˈmʌðər/", translation: "Mẹ" },
  { word: "Brother", phonetic: "/ˈbrʌðər/", translation: "Anh/Em trai" },
  { word: "Sister", phonetic: "/ˈsɪstər/", translation: "Chị/Em gái" },
  { word: "Parent", phonetic: "/ˈperənt/", translation: "Cha mẹ" },
  { word: "Child", phonetic: "/tʃaɪld/", translation: "Con" },
  { word: "Son", phonetic: "/sʌn/", translation: "Con trai" },
  { word: "Daughter", phonetic: "/ˈdɔːtər/", translation: "Con gái" },
  { word: "Husband", phonetic: "/ˈhʌzbənd/", translation: "Chồng" },
];

const seedVocabulary = async () => {
  try {
    console.log("📦 Seeding vocabulary...");

    const unit1 = await Unit.findOne({ where: { order_index: 1 } });
    const unit2 = await Unit.findOne({ where: { order_index: 2 } });

    if (!unit1 || !unit2) {
      console.log("⚠️  Units not found. Please seed units first.");
      return;
    }

    const unit1Lessons = await Lesson.findAll({
      where: { unit_id: unit1.id },
      order: [["order_index", "ASC"]],
      limit: 2,
    });

    const unit2Lessons = await Lesson.findAll({
      where: { unit_id: unit2.id },
      order: [["order_index", "ASC"]],
      limit: 1,
    });

    //  Xóa dữ liệu cũ bằng DELETE thay vì TRUNCATE
    await Vocabulary.destroy({
      where: {},
      force: true,
    });

    const vocabToCreate = [];

    // Unit 1 - Lesson 1
    unit1Vocabulary.slice(0, 10).forEach((vocab) => {
      vocabToCreate.push({
        unit_id: unit1.id,
        lesson_id: unit1Lessons[0].id,
        ...vocab,
        level: 1,
      });
    });

    // Unit 1 - Lesson 2
    unit1Vocabulary.slice(10, 20).forEach((vocab) => {
      vocabToCreate.push({
        unit_id: unit1.id,
        lesson_id: unit1Lessons[1].id,
        ...vocab,
        level: 1,
      });
    });

    // Unit 2 - Lesson 1
    unit2Vocabulary.slice(0, 10).forEach((vocab) => {
      vocabToCreate.push({
        unit_id: unit2.id,
        lesson_id: unit2Lessons[0].id,
        ...vocab,
        level: 1,
      });
    });

    const vocabulary = await Vocabulary.bulkCreate(vocabToCreate);

    console.log(` Successfully seeded ${vocabulary.length} vocabulary words!`);
    return vocabulary;
  } catch (error) {
    console.error(" Error seeding vocabulary:", error);
    throw error;
  }
};

module.exports = seedVocabulary;
