const { UserVocabulary, User, Vocabulary } = require("../models");

const seedUserVocabulary = async () => {
  try {
    console.log("📦 Seeding user vocabulary...");

    await UserVocabulary.destroy({ where: {}, force: true });

    const users = await User.findAll({ limit: 2 });
    const vocabulary = await Vocabulary.findAll({ limit: 15 });

    if (users.length === 0 || vocabulary.length === 0) {
      console.log("⚠️  Users or vocabulary not found. Please seed them first.");
      return;
    }

    const userVocabData = [];

    for (const user of users) {
      for (const vocab of vocabulary) {
        const masteryLevel = Math.floor(Math.random() * 6);
        const correctCount = Math.floor(Math.random() * 20);
        const incorrectCount = Math.floor(Math.random() * 10);

        userVocabData.push({
          user_id: user.id,
          vocab_id: vocab.id,
          is_favorite: Math.random() > 0.8,
          mastery_level: masteryLevel,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          last_reviewed: new Date(Date.now() - Math.random() * 86400000 * 7),
        });
      }
    }

    const userVocab = await UserVocabulary.bulkCreate(userVocabData);
    console.log(`✅ Successfully seeded ${userVocab.length} user vocabulary entries!`);
    return userVocab;
  } catch (error) {
    console.error("❌ Error seeding user vocabulary:", error);
    throw error;
  }
};

module.exports = seedUserVocabulary;
