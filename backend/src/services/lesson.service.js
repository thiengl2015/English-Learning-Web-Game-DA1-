const {
  Lesson,
  LessonProgress,
  Unit,
  UserProgress,
  Vocabulary,
} = require("../models");
const userService = require("./user.service");

class LessonService {

  calculateStars(correctCount, totalCount) {
    const accuracy = (correctCount / totalCount) * 100;

    if (accuracy >= 90) return 3;
    if (accuracy >= 70) return 2;
    if (accuracy >= 50) return 1;
    return 0;
  }

  calculateXP(lessonType, stars, isReview) {
    let baseXP = 0;

    if (lessonType === "test") {
      switch (stars) {
        case 3:
          baseXP = 200;
          break;
        case 2:
          baseXP = 150;
          break;
        case 1:
          baseXP = 100;
          break;
        default:
          baseXP = 0;
      }
    } else {
      switch (stars) {
        case 3:
          baseXP = 150;
          break;
        case 2:
          baseXP = 100;
          break;
        case 1:
          baseXP = 50;
          break;
        default:
          baseXP = 0;
      }
    }

    if (isReview) {
      baseXP = Math.floor(baseXP * 0.5);
    }

    return baseXP;
  }

  async getLessonById(lessonId, userId) {
    const lesson = await Lesson.findByPk(lessonId, {
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "title", "subtitle", "icon"],
        },
        {
          model: Vocabulary,
          as: "vocabulary",
          attributes: [
            "id",
            "word",
            "phonetic",
            "translation",
            "image_url",
            "audio_url",
          ],
        },
      ],
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const progress = await LessonProgress.findOne({
      where: {
        user_id: userId,
        lesson_id: lessonId,
      },
    });

    const isUnlocked = await this.isLessonUnlocked(lessonId, userId);

    const lessonData = lesson.toJSON();
    lessonData.progress = progress
      ? {
          status: progress.status,
          stars_earned: progress.stars_earned,
          xp_earned: progress.xp_earned,
          is_review: progress.is_review,
          completed_at: progress.completed_at,
        }
      : null;
    lessonData.unlocked = isUnlocked;

    return lessonData;
  }

  async isLessonUnlocked(lessonId, userId) {
    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const lessons = await Lesson.findAll({
      where: { unit_id: lesson.unit_id },
      order: [["order_index", "ASC"]],
    });

    if (lesson.order_index === 1) {

      if (lesson.unit_id === 1) {
        return true;
      }

      const previousUnit = await Unit.findOne({
        where: { order_index: lesson.unit_id - 1 },
      });

      if (previousUnit) {
        const previousUnitLastLesson = await Lesson.findOne({
          where: { unit_id: previousUnit.id },
          order: [["order_index", "DESC"]],
        });

        if (previousUnitLastLesson) {
          const previousProgress = await LessonProgress.findOne({
            where: {
              user_id: userId,
              lesson_id: previousUnitLastLesson.id,
              status: "completed",
            },
          });

          return !!previousProgress;
        }
      }

      return false;
    }

    const previousLesson = lessons.find(
      (l) => l.order_index === lesson.order_index - 1
    );

    if (!previousLesson) {
      return false;
    }

    const previousProgress = await LessonProgress.findOne({
      where: {
        user_id: userId,
        lesson_id: previousLesson.id,
        status: "completed",
      },
    });

    return !!previousProgress;
  }

  async startLesson(lessonId, userId) {
    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const isUnlocked = await this.isLessonUnlocked(lessonId, userId);

    if (!isUnlocked) {
      throw new Error("Lesson is locked. Complete previous lessons first.");
    }

    let progress = await LessonProgress.findOne({
      where: {
        user_id: userId,
        lesson_id: lessonId,
      },
    });

    if (!progress) {
      progress = await LessonProgress.create({
        user_id: userId,
        unit_id: lesson.unit_id,
        lesson_id: lessonId,
        status: "in-progress",
      });
    } else if (progress.status === "locked") {
      await progress.update({ status: "in-progress" });
    }

    return {
      lesson_id: lessonId,
      status: progress.status,
      message: "Lesson started successfully",
    };
  }

  async completeLesson(lessonId, userId, completionData) {
    const { correct_count, total_count, time_spent = 0 } = completionData;

    const lesson = await Lesson.findByPk(lessonId);

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    let progress = await LessonProgress.findOne({
      where: {
        user_id: userId,
        lesson_id: lessonId,
      },
    });

    if (!progress) {
      progress = await LessonProgress.create({
        user_id: userId,
        unit_id: lesson.unit_id,
        lesson_id: lessonId,
      });
    }

    const stars = this.calculateStars(correct_count, total_count);

    const isReview = progress.status === "completed";

    const xp = this.calculateXP(lesson.type, stars, isReview);

    await progress.update({
      status: "completed",
      stars_earned: stars,
      is_review: isReview,
      xp_earned: xp,
      correct_count: correct_count,
      total_count: total_count,
      completed_at: new Date(),
      first_completed_at: progress.first_completed_at || new Date(),
    });

    await userService.addXP(userId, xp);

    return {
      lesson_id: lessonId,
      status: "completed",
      stars_earned: stars,
      xp_earned: xp,
      is_review: isReview,
      accuracy: Math.round((correct_count / total_count) * 100),
      message: isReview
        ? `Review completed! Earned ${xp} XP (50% bonus)`
        : `Lesson completed! Earned ${xp} XP`,
    };
  }

  async getUserLessonProgress(userId) {
    const progress = await LessonProgress.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Lesson,
          as: "lesson",
          attributes: ["id", "title", "type", "order_index"],
          include: [
            {
              model: Unit,
              as: "unit",
              attributes: ["id", "title", "subtitle", "icon"],
            },
          ],
        },
      ],
      order: [[{ model: Lesson, as: "lesson" }, "order_index", "ASC"]],
    });

    return progress;
  }

  async getLessonStatistics(lessonId, userId) {
    const lesson = await Lesson.findByPk(lessonId, {
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "title", "subtitle"],
        },
      ],
    });

    if (!lesson) {
      throw new Error("Lesson not found");
    }

    const progress = await LessonProgress.findOne({
      where: {
        user_id: userId,
        lesson_id: lessonId,
      },
    });

    const stats = {
      lesson_info: {
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        unit: lesson.unit,
      },
      progress: progress
        ? {
            status: progress.status,
            stars_earned: progress.stars_earned,
            xp_earned: progress.xp_earned,
            correct_count: progress.correct_count,
            total_count: progress.total_count,
            accuracy:
              progress.total_count > 0
                ? Math.round(
                    (progress.correct_count / progress.total_count) * 100
                  )
                : 0,
            is_review: progress.is_review,
            completed_at: progress.completed_at,
            first_completed_at: progress.first_completed_at,
          }
        : {
            status: "locked",
            stars_earned: 0,
            xp_earned: 0,
          },
    };

    return stats;
  }
}

module.exports = new LessonService();
