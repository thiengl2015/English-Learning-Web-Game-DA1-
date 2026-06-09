const {
  Lesson,
  LessonProgress,
  QuestionChallenge,
  Unit,
  UnitTestConfig,
  UnitTestSession,
  UserProgress,
} = require("../models");
const { Op } = require("sequelize");

function parseJSON(value) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function normalize(value) {
  return String(value ?? "").toLowerCase().trim();
}

class ChallengeService {
  getTestId(unitId) {
    return `unit-${Number(unitId)}`;
  }

  async getChallenge(unitId) {
    const numericUnitId = Number(unitId);
    const unit = await Unit.findByPk(numericUnitId);

    if (!unit) {
      throw new Error("Unit not found.");
    }

    const config = await UnitTestConfig.findOne({
      where: {
        id: this.getTestId(numericUnitId),
        test_type: "challenge",
        unit_id: numericUnitId,
        is_active: true,
      },
    });

    if (!config) {
      throw new Error("Challenge not found.");
    }

    const questions = await QuestionChallenge.findAll({
      where: {
        unit_id: numericUnitId,
        is_active: true,
      },
      attributes: [
        "id",
        "unit_id",
        "section",
        "question_type",
        "content",
        "score",
        "display_order",
      ],
      order: [
        ["section", "ASC"],
        ["display_order", "ASC"],
      ],
    });

    const questionsBySection = { A: [], B: [], C: [], D: [] };
    questions.forEach((question) => {
      questionsBySection[question.section].push({
        id: question.id,
        unit_id: question.unit_id,
        section: question.section,
        question_type: question.question_type,
        content: question.content,
        score: question.score,
        display_order: question.display_order,
      });
    });

    return {
      id: config.id,
      unit_id: numericUnitId,
      title: config.title,
      description: config.description,
      pass_threshold: config.pass_threshold,
      total_score: config.total_score,
      unit: {
        id: unit.id,
        title: unit.title,
        subtitle: unit.subtitle,
        icon: unit.icon,
      },
      sections: {
        A: { name: "Read and match", count: questionsBySection.A.length },
        B: { name: "Listen, circle and write", count: questionsBySection.B.length },
        C: { name: "Choose and write", count: questionsBySection.C.length },
        D: { name: "Listen and repeat", count: questionsBySection.D.length },
      },
      questions: questionsBySection,
    };
  }

  async startSession(userId, unitId) {
    const numericUnitId = Number(unitId);
    const testId = this.getTestId(numericUnitId);

    const config = await UnitTestConfig.findOne({
      where: {
        id: testId,
        test_type: "challenge",
        unit_id: numericUnitId,
        is_active: true,
      },
    });

    if (!config) {
      throw new Error("Challenge not found.");
    }

    let session = await UnitTestSession.findOne({
      where: {
        user_id: userId,
        test_type: "challenge",
        test_id: testId,
        unit_id: numericUnitId,
        status: "in_progress",
      },
    });

    if (session) {
      return {
        session_id: session.id,
        test_id: testId,
        unit_id: numericUnitId,
        status: session.status,
        created_at: session.created_at,
        is_resumed: true,
      };
    }

    session = await UnitTestSession.create({
      user_id: userId,
      test_type: "challenge",
      test_id: testId,
      unit_id: numericUnitId,
      status: "in_progress",
      answers_data: {},
    });

    return {
      session_id: session.id,
      test_id: testId,
      unit_id: numericUnitId,
      status: session.status,
      created_at: session.created_at,
      is_resumed: false,
    };
  }

  async submitChallenge(sessionId, userId, unitId, answers, timeSpentSeconds = 0) {
    const numericUnitId = Number(unitId);
    const session = await UnitTestSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
        test_type: "challenge",
        unit_id: numericUnitId,
      },
      include: [
        {
          model: UnitTestConfig,
          as: "config",
          where: { test_type: "challenge" },
        },
      ],
    });

    if (!session) {
      throw new Error("Challenge session not found.");
    }

    if (session.status === "completed") {
      throw new Error("Challenge has already been submitted.");
    }

    const questions = await QuestionChallenge.findAll({
      where: {
        unit_id: numericUnitId,
        is_active: true,
      },
      order: [
        ["section", "ASC"],
        ["display_order", "ASC"],
      ],
    });

    const sectionScores = {
      A: { correct: 0, total: 0 },
      B: { correct: 0, total: 0 },
      C: { correct: 0, total: 0 },
      D: { correct: 0, total: 0 },
    };
    const sectionDetails = [];
    let totalScore = 0;

    questions.forEach((question) => {
      const section = String(question.section);
      const questionId = String(question.id);
      const userAnswer =
        answers?.[section]?.[questionId] ??
        answers?.[section]?.[Number(questionId)] ??
        null;
      const correctAnswer = parseJSON(question.correct_answer);
      const isCorrect =
        userAnswer !== null
          ? this.checkAnswer(question.question_type, userAnswer, correctAnswer)
          : false;

      sectionScores[section].total += question.score;

      if (isCorrect) {
        totalScore += question.score;
        sectionScores[section].correct += question.score;
      }

      sectionDetails.push({
        questionId: question.id,
        section,
        questionType: question.question_type,
        userAnswer,
        correctAnswer,
        isCorrect,
        score: isCorrect ? question.score : 0,
      });
    });

    const totalPossible = Object.values(sectionScores).reduce(
      (sum, section) => sum + section.total,
      0
    );
    const scorePercentage =
      totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const passingScore = totalPossible;
    const passed = totalPossible > 0 && totalScore === passingScore;
    const completedAt = new Date();

    await session.update({
      answers_data: answers,
      score: totalScore,
      pass: passed,
      section_scores: sectionScores,
      section_details: sectionDetails,
      status: "completed",
      time_spent_seconds: timeSpentSeconds,
      completed_at: completedAt,
    });

    const unlockProgress = passed
      ? await this.markUnitLessonsFullStars(userId, numericUnitId)
      : null;

    return {
      session_id: session.id,
      test_id: session.test_id,
      unit_id: numericUnitId,
      score: totalScore,
      total_possible: totalPossible,
      score_percentage: scorePercentage,
      pass_threshold: 100,
      passing_score: passingScore,
      passed,
      section_scores: sectionScores,
      unlock_progress: unlockProgress,
      time_spent_seconds: timeSpentSeconds,
      completed_at: completedAt,
    };
  }

  checkAnswer(questionType, userAnswer, correctAnswer) {
    switch (questionType) {
      case "match":
        return (
          normalize(userAnswer?.selected ?? userAnswer?.choice) ===
          normalize(correctAnswer?.selected ?? correctAnswer?.choice)
        );

      case "listen_write":
        return (
          normalize(userAnswer?.selected) === normalize(correctAnswer?.selected) &&
          normalize(userAnswer?.written) === normalize(correctAnswer?.written)
        );

      case "fill_blank":
      case "word_bank":
        return this.checkFillBlankAnswer(userAnswer, correctAnswer);

      case "listen_repeat":
        return (
          normalize(userAnswer?.transcript ?? userAnswer?.answer ?? userAnswer?.spoken) ===
          normalize(correctAnswer?.answer ?? correctAnswer?.word)
        );

      default:
        return false;
    }
  }

  checkFillBlankAnswer(userAnswer, correctAnswer) {
    if (correctAnswer?.answers) {
      const correctAnswers = Array.isArray(correctAnswer.answers)
        ? correctAnswer.answers
        : Object.entries(correctAnswer.answers).map(([id, answer]) => ({ id, answer }));
      const submittedAnswers =
        userAnswer?.answers ??
        (Array.isArray(userAnswer) ? userAnswer : userAnswer && typeof userAnswer === "object" ? userAnswer : {});

      return correctAnswers.every((item, index) => {
        const id = String(item.id ?? index);
        const expected = item.answer ?? item.value ?? item;
        const submitted = Array.isArray(submittedAnswers)
          ? submittedAnswers[index]
          : submittedAnswers[id];

        return normalize(submitted) === normalize(expected);
      });
    }

    return normalize(userAnswer?.answer ?? userAnswer) === normalize(correctAnswer?.answer ?? correctAnswer);
  }

  async markUnitLessonsFullStars(userId, unitId) {
    const lessons = await Lesson.findAll({
      where: { unit_id: unitId },
      attributes: ["id", "unit_id"],
      order: [["order_index", "ASC"]],
    });

    if (!lessons.length) {
      return {
        unit_id: unitId,
        lessons_completed: 0,
        lessons_upgraded: 0,
        stars_awarded: 0,
        unit_completed: false,
      };
    }

    const lessonIds = lessons.map((lesson) => lesson.id);
    const existingProgress = await LessonProgress.findAll({
      where: {
        user_id: userId,
        lesson_id: { [Op.in]: lessonIds },
      },
    });
    const progressByLessonId = new Map(
      existingProgress.map((progress) => [Number(progress.lesson_id), progress])
    );
    const wasUnitCompleted = lessons.every(
      (lesson) => progressByLessonId.get(Number(lesson.id))?.status === "completed"
    );
    const completedAt = new Date();
    let newlyCompletedLessons = 0;
    let upgradedLessons = 0;

    for (const lesson of lessons) {
      const progress = progressByLessonId.get(Number(lesson.id));

      if (progress) {
        if (progress.status !== "completed") {
          newlyCompletedLessons += 1;
        }
        if ((progress.stars_earned || 0) < 3) {
          upgradedLessons += 1;
        }

        await progress.update({
          unit_id: lesson.unit_id,
          status: "completed",
          stars_earned: 3,
          completed_at: completedAt,
          first_completed_at: progress.first_completed_at || completedAt,
        });
      } else {
        newlyCompletedLessons += 1;
        upgradedLessons += 1;
        await LessonProgress.create({
          user_id: userId,
          unit_id: lesson.unit_id,
          lesson_id: lesson.id,
          status: "completed",
          stars_earned: 3,
          is_review: false,
          xp_earned: 0,
          correct_count: 0,
          total_count: 0,
          completed_at: completedAt,
          first_completed_at: completedAt,
        });
      }
    }

    const unitCompleted = !wasUnitCompleted && lessons.length > 0;

    if (newlyCompletedLessons > 0 || unitCompleted) {
      const [userProgress] = await UserProgress.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
      });

      userProgress.lessons_completed =
        (userProgress.lessons_completed || 0) + newlyCompletedLessons;
      if (unitCompleted) {
        userProgress.units_completed = (userProgress.units_completed || 0) + 1;
      }
      await userProgress.save();
    }

    return {
      unit_id: unitId,
      lessons_completed: newlyCompletedLessons,
      lessons_upgraded: upgradedLessons,
      stars_awarded: lessons.length * 3,
      unit_completed: unitCompleted,
    };
  }

  async getResult(sessionId, userId, unitId) {
    const session = await UnitTestSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
        unit_id: Number(unitId),
        test_type: "challenge",
      },
      include: [{ model: UnitTestConfig, as: "config" }],
    });

    if (!session) {
      throw new Error("Challenge session not found.");
    }

    if (session.status !== "completed") {
      throw new Error("Challenge has not been completed yet.");
    }

    return {
      session_id: session.id,
      test_id: session.test_id,
      unit_id: session.unit_id,
      score: session.score,
      total_possible: session.config?.total_score || 10,
      score_percentage: session.config?.total_score
        ? Math.round((session.score / session.config.total_score) * 100)
        : 0,
      passed: session.pass,
      section_scores: session.section_scores,
      details: session.section_details,
      time_spent_seconds: session.time_spent_seconds,
      completed_at: session.completed_at,
    };
  }

  async getHistory(userId, { limit = 10, page = 1 } = {}) {
    const offset = (page - 1) * limit;
    const { count, rows } = await UnitTestSession.findAndCountAll({
      where: {
        user_id: userId,
        test_type: "challenge",
      },
      include: [
        {
          model: UnitTestConfig,
          as: "config",
          attributes: ["id", "title", "unit_id"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit, 10),
      offset,
    });

    return {
      sessions: rows.map((session) => ({
        session_id: session.id,
        test_id: session.test_id,
        unit_id: session.unit_id,
        title: session.config?.title,
        score: session.score,
        passed: session.pass,
        status: session.status,
        time_spent_seconds: session.time_spent_seconds,
        created_at: session.created_at,
        completed_at: session.completed_at,
      })),
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

module.exports = new ChallengeService();
