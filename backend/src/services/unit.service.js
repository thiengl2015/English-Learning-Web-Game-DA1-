const { Unit, Lesson, LessonProgress } = require("../models");

class UnitService {
  async getAllUnits(userId) {
    const units = await Unit.findAll({
      order: [["order_index", "ASC"]],
      include: [
        {
          model: Lesson,
          as: "lessons",
          attributes: ["id", "title", "type", "order_index"],
          order: [["order_index", "ASC"]],
        },
      ],
    });

    const lessonProgress = await LessonProgress.findAll({
      where: { user_id: userId },
    });

    const unitsWithProgress = units.map((unit) => {
      const unitData = unit.toJSON();

      const totalLessons = unitData.lessons.length;
      const completedLessons = unitData.lessons.filter((lesson) => {
        return lessonProgress.some(
          (progress) =>
            progress.lesson_id === lesson.id && progress.status === "completed"
        );
      }).length;

      unitData.completion_percentage =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;
      unitData.completed_lessons = completedLessons;
      unitData.total_lessons = totalLessons;

      unitData.unlocked = unitData.order_index === 1 || completedLessons > 0;

      return unitData;
    });

    return unitsWithProgress;
  }

  async getUnitById(unitId, userId) {
    const unit = await Unit.findByPk(unitId, {
      include: [
        {
          model: Lesson,
          as: "lessons",
          attributes: ["id", "title", "type", "order_index"],
          order: [["order_index", "ASC"]],
        },
      ],
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    const lessonProgress = await LessonProgress.findAll({
      where: {
        user_id: userId,
        unit_id: unitId,
      },
    });

    const unitData = unit.toJSON();

    unitData.lessons = unitData.lessons.map((lesson, index) => {
      const progress = lessonProgress.find((p) => p.lesson_id === lesson.id);

      return {
        ...lesson,
        status: progress ? progress.status : "locked",
        stars_earned: progress ? progress.stars_earned : 0,
        xp_earned: progress ? progress.xp_earned : 0,
        unlocked:
          index === 0 ||
          lessonProgress.some(
            (p) =>
              p.lesson_id === unitData.lessons[index - 1].id &&
              p.status === "completed"
          ),
      };
    });

    const totalLessons = unitData.lessons.length;
    const completedLessons = unitData.lessons.filter(
      (l) => l.status === "completed"
    ).length;

    unitData.completion_percentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    unitData.completed_lessons = completedLessons;
    unitData.total_lessons = totalLessons;

    return unitData;
  }

  async getUnitStatistics(unitId, userId) {
    const unit = await Unit.findByPk(unitId, {
      include: [
        {
          model: Lesson,
          as: "lessons",
        },
      ],
    });

    if (!unit) {
      throw new Error("Unit not found");
    }

    const lessonProgress = await LessonProgress.findAll({
      where: {
        user_id: userId,
        unit_id: unitId,
      },
    });

    const stats = {
      unit_info: {
        id: unit.id,
        title: unit.title,
        subtitle: unit.subtitle,
        icon: unit.icon,
      },
      progress: {
        total_lessons: unit.lessons.length,
        completed_lessons: lessonProgress.filter(
          (p) => p.status === "completed"
        ).length,
        in_progress_lessons: lessonProgress.filter(
          (p) => p.status === "in-progress"
        ).length,
        total_xp_earned: lessonProgress.reduce(
          (sum, p) => sum + (p.xp_earned || 0),
          0
        ),
        total_stars: lessonProgress.reduce(
          (sum, p) => sum + (p.stars_earned || 0),
          0
        ),
        completion_percentage:
          unit.lessons.length > 0
            ? Math.round(
                (lessonProgress.filter((p) => p.status === "completed").length /
                  unit.lessons.length) *
                  100
              )
            : 0,
      },
    };

    return stats;
  }
}

module.exports = new UnitService();
