const { Unit, Lesson, LessonProgress, sequelize } = require("../models");

class UnitService {

  async getAllUnits(userId) {
    try {
      const units = await Unit.findAll({
        order: [["order_index", "ASC"]],
      });

      if (!units || units.length === 0) {
        return [];
      }

      const unitIds = units.map((u) => u.id);

      const progress = await LessonProgress.findAll({
        where: {
          user_id: userId,
          unit_id: { [require("sequelize").Op.in]: unitIds },
        },
      });

      const result = units.map((unit) => {
        const unitData = unit.toJSON ? unit.toJSON() : unit;
        const unitProgress = progress.filter((p) => p.unit_id === unitData.id);

        const totalLessons = unitData.total_lessons || 5;
        const completedLessons = unitProgress.filter(
          (p) => p.status === "completed"
        ).length;
        const totalStars = unitProgress.reduce(
          (sum, p) => sum + (p.stars_earned || 0),
          0
        );
        const maxStars = totalLessons * 3;

        const isUnlocked =
          unitData.order_index === 1 ||
          this._checkPreviousUnitCompleted(units, unitData, progress, userId);

        return {
          id: unitData.id,
          title: unitData.title,
          subtitle: unitData.subtitle,
          icon: unitData.icon,
          order_index: unitData.order_index,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress_percentage: totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0,
          stars_earned: totalStars,
          max_stars: maxStars,
          is_unlocked: isUnlocked,
        };
      });

      return result;
    } catch (error) {
      console.error("Error in getAllUnits:", error);
      throw error;
    }
  }

  _checkPreviousUnitCompleted(units, currentUnit, allProgress, userId) {
    const previousUnit = units.find(
      (u) => u.order_index === currentUnit.order_index - 1
    );
    if (!previousUnit) return false;

    const lastLessonOfPrevUnit = allProgress.find(
      (p) =>
        p.unit_id === previousUnit.id && p.status === "completed"
    );
    return !!lastLessonOfPrevUnit;
  }

  async getUnitById(unitId, userId) {
    try {
      const unit = await Unit.findByPk(unitId);

      if (!unit) {
        throw new Error("Unit not found");
      }

      const lessons = await Lesson.findAll({
        where: { unit_id: unitId },
        order: [["order_index", "ASC"]],
      });

      const progress = await LessonProgress.findAll({
        where: {
          user_id: userId,
          unit_id: unitId,
        },
      });

      const unitData = unit.toJSON ? unit.toJSON() : unit;
      const totalLessons = lessons.length;
      const completedLessons = progress.filter(
        (p) => p.status === "completed"
      ).length;
      const totalStars = progress.reduce(
        (sum, p) => sum + (p.stars_earned || 0),
        0
      );
      const maxStars = totalLessons * 3;

      const lessonDetails = lessons.map((lesson, index) => {
        const lessonData = lesson.toJSON ? lesson.toJSON() : lesson;
        const lessonProgress = progress.find(
          (p) => p.lesson_id === lessonData.id
        );

        let isUnlocked = false;
        if (index === 0) {
          if (unitData.order_index === 1) {
            isUnlocked = true;
          } else {
            isUnlocked = false;
          }
        } else {
          const prevLesson = lessons[index - 1];
          const prevProgress = progress.find(
            (p) => p.lesson_id === prevLesson.id
          );
          isUnlocked = prevProgress && prevProgress.status === "completed";
        }

        return {
          id: lessonData.id,
          title: lessonData.title,
          type: lessonData.type,
          order_index: lessonData.order_index,
          completed: lessonProgress
            ? lessonProgress.status === "completed"
            : false,
          stars: lessonProgress ? lessonProgress.stars_earned : 0,
          is_unlocked: isUnlocked,
          xp_earned: lessonProgress ? lessonProgress.xp_earned : 0,
          completed_at: lessonProgress ? lessonProgress.completed_at : null,
        };
      });

      return {
        id: unitData.id,
        title: unitData.title,
        subtitle: unitData.subtitle,
        icon: unitData.icon,
        order_index: unitData.order_index,
        total_lessons: totalLessons,
        completed_lessons: completedLessons,
        progress_percentage:
          totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        stars_earned: totalStars,
        max_stars: maxStars,
        lessons: lessonDetails,
      };
    } catch (error) {
      console.error("Error in getUnitById:", error);
      throw error;
    }
  }

  async getUnitStatistics(unitId, userId) {
    try {
      const unit = await Unit.findByPk(unitId);

      if (!unit) {
        throw new Error("Unit not found");
      }

      const lessons = await Lesson.findAll({
        where: { unit_id: unitId },
        order: [["order_index", "ASC"]],
      });

      const progress = await LessonProgress.findAll({
        where: {
          user_id: userId,
          unit_id: unitId,
        },
      });

      const completedProgress = progress.filter(
        (p) => p.status === "completed"
      );

      const totalStars = completedProgress.reduce(
        (sum, p) => sum + (p.stars_earned || 0),
        0
      );

      const totalXP = completedProgress.reduce(
        (sum, p) => sum + (p.xp_earned || 0),
        0
      );

      const totalCorrect = completedProgress.reduce(
        (sum, p) => sum + (p.correct_count || 0),
        0
      );
      const totalQuestions = completedProgress.reduce(
        (sum, p) => sum + (p.total_count || 0),
        0
      );

      const accuracy =
        totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

      const vocabularyCount = await require("../models").Vocabulary.count({
        where: { unit_id: unitId },
      });

      const lessonStats = lessons.map((lesson) => {
        const lp = progress.find((p) => p.lesson_id === lesson.id);
        return {
          lesson_id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          status: lp ? lp.status : "locked",
          stars_earned: lp ? lp.stars_earned : 0,
          xp_earned: lp ? lp.xp_earned : 0,
          accuracy: lp && lp.total_count > 0
            ? Math.round((lp.correct_count / lp.total_count) * 100)
            : 0,
          completed_at: lp ? lp.completed_at : null,
        };
      });

      return {
        unit: {
          id: unit.id,
          title: unit.title,
          subtitle: unit.subtitle,
          icon: unit.icon,
        },
        overview: {
          total_lessons: lessons.length,
          completed_lessons: completedProgress.length,
          progress_percentage: lessons.length > 0
            ? Math.round((completedProgress.length / lessons.length) * 100)
            : 0,
          total_stars: totalStars,
          max_stars: lessons.length * 3,
          total_xp: totalXP,
          accuracy: accuracy,
          vocabulary_count: vocabularyCount,
        },
        lesson_breakdown: lessonStats,
      };
    } catch (error) {
      console.error("Error in getUnitStatistics:", error);
      throw error;
    }
  }

  async getLessonsByUnit(unitId, userId) {
    try {
      const lessons = await Lesson.findAll({
        where: { unit_id: unitId },
        order: [["order_index", "ASC"]],
      });

      if (!lessons || lessons.length === 0) {
        return [];
      }

      const progress = await LessonProgress.findAll({
        where: {
          user_id: userId,
          unit_id: unitId,
        },
      });

      const result = lessons.map((lesson, index) => {
        const lessonData = lesson.toJSON ? lesson.toJSON() : lesson;
        const currentProgress = progress.find(
          (p) => p.lesson_id === lessonData.id
        );
        const isCompleted = currentProgress
          ? currentProgress.status === "completed"
          : false;

        let isUnlocked = false;
        if (index === 0) {
          isUnlocked = true;
        } else {
          const prevLessonId = lessons[index - 1].id;
          const prevProgress = progress.find(
            (p) => p.lesson_id === prevLessonId
          );
          isUnlocked =
            prevProgress && prevProgress.status === "completed";
        }

        return {
          id: lessonData.id,
          title: lessonData.title,
          type: lessonData.type,
          completed: isCompleted,
          stars: currentProgress ? currentProgress.stars_earned : 0,
          position: { x: 50, y: 50 },
          is_unlocked: isUnlocked,
        };
      });

      return result;
    } catch (error) {
      console.error("Error in getLessonsByUnit:", error);
      throw error;
    }
  }
}

module.exports = new UnitService();
