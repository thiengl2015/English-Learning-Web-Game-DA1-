const { Vocabulary, UserVocabulary, Unit, Lesson, User, UserProgress } = require("../models");
const { Op } = require("sequelize");

class VocabularyService {
  async getAllVocabulary(userId, filters = {}) {
    const { search, level, unit_id, lesson_id, page = 1, limit = 20 } = filters;

    const where = {};

    if (search) {
      where[Op.or] = [
        { word: { [Op.like]: `%${search}%` } },
        { translation: { [Op.like]: `%${search}%` } },
      ];
    }

    if (level) {
      where.level = level;
    }

    if (unit_id) {
      where.unit_id = unit_id;
    }

    if (lesson_id) {
      where.lesson_id = lesson_id;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Vocabulary.findAndCountAll({
      where,
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "title", "subtitle", "icon"],
        },
        {
          model: Lesson,
          as: "lesson",
          attributes: ["id", "title", "type"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["id", "ASC"]],
    });

    const vocabIds = rows.map((v) => v.id);
    const userProgress = await UserVocabulary.findAll({
      where: {
        user_id: userId,
        vocab_id: { [Op.in]: vocabIds },
      },
    });

    const vocabulary = rows.map((vocab) => {
      const vocabData = vocab.toJSON();
      const progress = userProgress.find((p) => p.vocab_id === vocab.id);

      vocabData.user_progress = progress
        ? {
            is_favorite: progress.is_favorite,
            mastery_level: progress.mastery_level,
            correct_count: progress.correct_count,
            incorrect_count: progress.incorrect_count,
            last_reviewed: progress.last_reviewed,
          }
        : null;

      return vocabData;
    });

    return {
      vocabulary,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getVocabularyById(vocabId, userId) {
    const vocab = await Vocabulary.findByPk(vocabId, {
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "title", "subtitle", "icon"],
        },
        {
          model: Lesson,
          as: "lesson",
          attributes: ["id", "title", "type"],
        },
      ],
    });

    if (!vocab) {
      throw new Error("Vocabulary not found");
    }

    const userProgress = await UserVocabulary.findOne({
      where: {
        user_id: userId,
        vocab_id: vocabId,
      },
    });

    const vocabData = vocab.toJSON();
    vocabData.user_progress = userProgress
      ? {
          is_favorite: userProgress.is_favorite,
          mastery_level: userProgress.mastery_level,
          correct_count: userProgress.correct_count,
          incorrect_count: userProgress.incorrect_count,
          last_reviewed: userProgress.last_reviewed,
        }
      : null;

    return vocabData;
  }

  async getVocabularyByLesson(lessonId, userId) {
    const vocabulary = await Vocabulary.findAll({
      where: { lesson_id: lessonId },
      order: [["id", "ASC"]],
    });

    const vocabIds = vocabulary.map((v) => v.id);
    const userProgress = await UserVocabulary.findAll({
      where: {
        user_id: userId,
        vocab_id: { [Op.in]: vocabIds },
      },
    });

    return vocabulary.map((vocab) => {
      const vocabData = vocab.toJSON();
      const progress = userProgress.find((p) => p.vocab_id === vocab.id);

      vocabData.user_progress = progress
        ? {
            is_favorite: progress.is_favorite,
            mastery_level: progress.mastery_level,
            correct_count: progress.correct_count,
            incorrect_count: progress.incorrect_count,
            last_reviewed: progress.last_reviewed,
          }
        : null;

      return vocabData;
    });
  }

  async getVocabularyByUnit(unitId, userId) {
    const vocabulary = await Vocabulary.findAll({
      where: { unit_id: unitId },
      include: [
        {
          model: Lesson,
          as: "lesson",
          attributes: ["id", "title", "type", "order_index"],
        },
      ],
      order: [
        ["lesson_id", "ASC"],
        ["id", "ASC"],
      ],
    });

    const vocabIds = vocabulary.map((v) => v.id);
    const userProgress = await UserVocabulary.findAll({
      where: {
        user_id: userId,
        vocab_id: { [Op.in]: vocabIds },
      },
    });

    return vocabulary.map((vocab) => {
      const vocabData = vocab.toJSON();
      const progress = userProgress.find((p) => p.vocab_id === vocab.id);

      vocabData.user_progress = progress
        ? {
            is_favorite: progress.is_favorite,
            mastery_level: progress.mastery_level,
            correct_count: progress.correct_count,
            incorrect_count: progress.incorrect_count,
            last_reviewed: progress.last_reviewed,
          }
        : null;

      return vocabData;
    });
  }

  async markFavorite(vocabId, userId) {
    const vocab = await Vocabulary.findByPk(vocabId);
    if (!vocab) {
      throw new Error("Vocabulary not found");
    }

    let userVocab = await UserVocabulary.findOne({
      where: {
        user_id: userId,
        vocab_id: vocabId,
      },
    });

    if (!userVocab) {
      userVocab = await UserVocabulary.create({
        user_id: userId,
        vocab_id: vocabId,
        is_favorite: true,
      });
    } else {
      await userVocab.update({
        is_favorite: true,
      });
    }

    return {
      vocab_id: vocabId,
      is_favorite: true,
      message: "Đã thêm vào danh sách yêu thích",
    };
  }

  async unmarkFavorite(vocabId, userId) {
    const userVocab = await UserVocabulary.findOne({
      where: {
        user_id: userId,
        vocab_id: vocabId,
      },
    });

    if (!userVocab) {
      throw new Error("Vocabulary progress not found");
    }

    await userVocab.update({
      is_favorite: false,
    });

    return {
      vocab_id: vocabId,
      is_favorite: false,
      message: "Đã xóa khỏi danh sách yêu thích",
    };
  }

  async getFavoriteVocabulary(userId) {
    const favorites = await UserVocabulary.findAll({
      where: {
        user_id: userId,
        is_favorite: true,
      },
      include: [
        {
          model: Vocabulary,
          as: "vocabulary",
          include: [
            {
              model: Unit,
              as: "unit",
              attributes: ["id", "title", "icon"],
            },
            {
              model: Lesson,
              as: "lesson",
              attributes: ["id", "title", "type"],
            },
          ],
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    return favorites.map((fav) => ({
      ...fav.vocabulary.toJSON(),
      user_progress: {
        is_favorite: fav.is_favorite,
        mastery_level: fav.mastery_level,
        correct_count: fav.correct_count,
        incorrect_count: fav.incorrect_count,
        last_reviewed: fav.last_reviewed,
      },
    }));
  }

  async getLearnedVocabulary(userId) {
    const learned = await UserVocabulary.findAll({
      where: {
        user_id: userId,
      },
      include: [
        {
          model: Vocabulary,
          as: "vocabulary",
          include: [
            {
              model: Unit,
              as: "unit",
              attributes: ["id", "title", "icon"],
            },
            {
              model: Lesson,
              as: "lesson",
              attributes: ["id", "title", "type"],
            },
          ],
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    return learned
      .filter((item) => item.vocabulary)
      .map((item) => ({
        ...item.vocabulary.toJSON(),
        user_progress: {
          is_favorite: item.is_favorite,
          mastery_level: item.mastery_level,
          correct_count: item.correct_count,
          incorrect_count: item.incorrect_count,
          last_reviewed: item.last_reviewed,
        },
      }));
  }

  async updateProgress(vocabId, userId, progressData) {
    const { correct, mastery_level } = progressData;

    const vocab = await Vocabulary.findByPk(vocabId);
    if (!vocab) {
      throw new Error("Vocabulary not found");
    }

    let userVocab = await UserVocabulary.findOne({
      where: {
        user_id: userId,
        vocab_id: vocabId,
      },
    });

    const isNewVocabularyProgress = !userVocab;

    if (!userVocab) {
      userVocab = await UserVocabulary.create({
        user_id: userId,
        vocab_id: vocabId,
      });
    }

    const updates = {
      last_reviewed: new Date(),
    };

    if (correct !== undefined) {
      if (correct) {
        updates.correct_count = userVocab.correct_count + 1;

        if (userVocab.mastery_level < 5) {
          updates.mastery_level = userVocab.mastery_level + 1;
        }
      } else {
        updates.incorrect_count = userVocab.incorrect_count + 1;

        if (userVocab.mastery_level > 0) {
          updates.mastery_level = userVocab.mastery_level - 1;
        }
      }
    }

    if (mastery_level !== undefined) {
      updates.mastery_level = mastery_level;
    }

    await userVocab.update(updates);

    if (isNewVocabularyProgress) {
      const [userProgress] = await UserProgress.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
      });
      userProgress.words_learned = (userProgress.words_learned || 0) + 1;
      await userProgress.save();
    }

    return userVocab;
  }

  /**
   * Enroll every vocabulary word of a lesson into the user's learned list so
   * the words show up in /client/practice/vocabulary after the lesson is done.
   * Idempotent: only creates missing user_vocabulary rows (keeps existing
   * mastery/favorite untouched).
   */
  async enrollLessonVocabulary(userId, lessonId) {
    if (!userId || !lessonId) return { enrolled: 0 };

    const vocab = await Vocabulary.findAll({
      where: { lesson_id: lessonId },
      attributes: ["id"],
    });
    if (vocab.length === 0) return { enrolled: 0 };

    const vocabIds = vocab.map((v) => v.id);
    const existing = await UserVocabulary.findAll({
      where: { user_id: userId, vocab_id: { [Op.in]: vocabIds } },
      attributes: ["vocab_id"],
    });
    const existingIds = new Set(existing.map((e) => e.vocab_id));
    const toCreate = vocabIds.filter((id) => !existingIds.has(id));
    if (toCreate.length === 0) return { enrolled: 0 };

    // Best-effort: enrolling vocabulary must never fail lesson/game completion.
    // ignoreDuplicates guards against the (user_id, vocab_id) unique index when a
    // concurrent request inserts the same word between the check above and here.
    try {
      await UserVocabulary.bulkCreate(
        toCreate.map((id) => ({
          user_id: userId,
          vocab_id: id,
          mastery_level: 1,
          last_reviewed: new Date(),
        })),
        { ignoreDuplicates: true }
      );

      const [userProgress] = await UserProgress.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
      });
      userProgress.words_learned = (userProgress.words_learned || 0) + toCreate.length;
      await userProgress.save();

      return { enrolled: toCreate.length };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("enrollLessonVocabulary failed:", err.message);
      return { enrolled: 0 };
    }
  }

  async getStatistics(userId) {
    const total = await Vocabulary.count();

    const userProgress = await UserVocabulary.findAll({
      where: { user_id: userId },
    });

    const learned = userProgress.length;
    const favorites = userProgress.filter((p) => p.is_favorite).length;
    const mastered = userProgress.filter((p) => p.mastery_level >= 4).length;

    const totalCorrect = userProgress.reduce(
      (sum, p) => sum + p.correct_count,
      0
    );
    const totalIncorrect = userProgress.reduce(
      (sum, p) => sum + p.incorrect_count,
      0
    );
    const totalAttempts = totalCorrect + totalIncorrect;

    const accuracy =
      totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return {
      total_vocabulary: total,
      learned: learned,
      favorites: favorites,
      mastered: mastered,
      accuracy: accuracy,
      total_correct: totalCorrect,
      total_incorrect: totalIncorrect,
      progress_percentage: Math.round((learned / total) * 100),
    };
  }
}

module.exports = new VocabularyService();
