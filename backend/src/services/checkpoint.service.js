const {
  UnitTestConfig,
  UnitTestSession,
  QuestionCheckpoint,
  Lesson,
  LessonProgress,
  UserProgress,
} = require("../models");
const { Op } = require("sequelize");
const missionService = require("./mission.service");
const {
  normalizeAnswerText,
  isExactTextMatch,
  isContextualTextMatch,
  getCandidateTexts,
} = require("../utils/answer.util");

// Helper to safely parse JSON (handle both string and object)
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

class CheckpointService {
  /**
   * Lay danh sach tat ca checkpoint
   */
  async getCheckpoints() {
    const configs = await UnitTestConfig.findAll({
      where: {
        test_type: "checkpoint",
        is_active: true,
      },
      attributes: [
        "id",
        "title",
        "description",
        "units_covered",
        "pass_threshold",
        "total_score",
      ],
      order: [["id", "ASC"]],
    });

    return configs.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      units_covered: parseJSON(c.units_covered),
      pass_threshold: c.pass_threshold,
      total_score: c.total_score,
    }));
  }

  /**
   * Lay cau hoi checkpoint theo id (khong tra dap an)
   */
  async getCheckpoint(checkpointId) {
    const config = await UnitTestConfig.findOne({
      where: {
        id: checkpointId,
        test_type: "checkpoint",
        is_active: true,
      },
    });

    if (!config) {
      throw new Error("Checkpoint not found.");
    }

    const questions = await QuestionCheckpoint.findAll({
      where: {
        checkpoint_id: checkpointId,
        is_active: true,
      },
      attributes: [
        "id",
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

    // Group by section
    const questionsBySection = {
      A: [],
      B: [],
      C: [],
      D: [],
      E: [],
    };

    questions.forEach((q) => {
      questionsBySection[q.section].push({
        id: q.id,
        question_type: q.question_type,
        content: q.content,
        score: q.score,
        display_order: q.display_order,
      });
    });

    return {
      id: config.id,
      title: config.title,
      description: config.description,
      units_covered: parseJSON(config.units_covered),
      pass_threshold: config.pass_threshold,
      total_score: config.total_score,
      sections: {
        A: { name: "Matching", count: questionsBySection.A.length },
        B: { name: "Listen & Write", count: questionsBySection.B.length },
        C: { name: "Fill in the Blank", count: questionsBySection.C.length },
        D: { name: "Unscramble", count: questionsBySection.D.length },
        E: { name: "Read & Speak", count: questionsBySection.E.length },
      },
      questions: questionsBySection,
    };
  }

  /**
   * Bat dau lam bai checkpoint (tao session moi hoac lay session cu)
   */
  async startSession(userId, checkpointId) {
    // Kiem tra checkpoint co ton tai
    const config = await UnitTestConfig.findOne({
      where: {
        id: checkpointId,
        test_type: "checkpoint",
        is_active: true,
      },
    });

    if (!config) {
      throw new Error("Checkpoint not found.");
    }

    // Kiem tra session dang in_progress cua user cho checkpoint nay
    let session = await UnitTestSession.findOne({
      where: {
        user_id: userId,
        test_id: checkpointId,
        status: "in_progress",
      },
    });

    if (session) {
      // Tra ve session cu
      return {
        session_id: session.id,
        checkpoint_id: checkpointId,
        status: session.status,
        created_at: session.created_at,
        is_resumed: true,
      };
    }

    // Tao session moi
    session = await UnitTestSession.create({
      user_id: userId,
      test_type: "checkpoint",
      test_id: checkpointId,
      units_covered: config.units_covered,
      status: "in_progress",
      answers_data: [],
    });

    return {
      session_id: session.id,
      checkpoint_id: checkpointId,
      status: session.status,
      created_at: session.created_at,
      is_resumed: false,
    };
  }

  /**
   * Cham diem va luu ket qua checkpoint
   */
  async submitCheckpoint(sessionId, userId, answers, timeSpentSeconds = 0) {
    const session = await UnitTestSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
        test_type: "checkpoint",
      },
      include: [
        {
          model: UnitTestConfig,
          as: "config",
          where: { test_type: "checkpoint" },
        },
      ],
    });

    if (!session) {
      throw new Error("Checkpoint session not found.");
    }

    if (session.status === "completed") {
      throw new Error("Checkpoint has already been submitted.");
    }

    // Lay cau hoi de cham diem
    const questions = await QuestionCheckpoint.findAll({
      where: {
        checkpoint_id: session.test_id,
        is_active: true,
      },
      order: [
        ["section", "ASC"],
        ["display_order", "ASC"],
      ],
    });

    // Cham diem tung cau
    const sectionScores = {
      A: { correct: 0, total: 0 },
      B: { correct: 0, total: 0 },
      C: { correct: 0, total: 0 },
      D: { correct: 0, total: 0 },
      E: { correct: 0, total: 0 },
    };
    const sectionDetails = [];
    let totalScore = 0;
    let totalPossible = 0;

    questions.forEach((q) => {
      const section = String(q.section); // Ensure section is always a string (ENUM can return number)
      const qIdStr = String(q.id);
      sectionScores[section].total += q.score;

      // Try number then string keys to handle both cases
      const userAnswer =
        answers[section]?.[qIdStr] ??
        answers[section]?.[Number(qIdStr)] ??
        null;

      let isCorrect = false;

      // Parse correct_answer in case it's a JSON string from MySQL
      const correctAnswer = parseJSON(q.correct_answer);

      if (userAnswer !== null) {
        isCorrect = this.checkAnswer(q.question_type, userAnswer, correctAnswer);
      }

      if (isCorrect) {
        totalScore += q.score;
        sectionScores[section].correct += q.score;
      }

      sectionDetails.push({
        questionId: q.id,
        section: section,
        questionType: q.question_type,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        score: isCorrect ? q.score : 0,
      });
    });

    totalPossible = Object.values(sectionScores).reduce((sum, s) => sum + s.total, 0);

    // Tinh % diem va nguong pass toi thieu (80% cua 20 cau = 16 cau)
    const scorePercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const passThreshold = session.config.pass_threshold || 80;
    const passingScore = totalPossible > 0 ? Math.ceil((passThreshold / 100) * totalPossible) : 0;
    const passed = totalScore >= passingScore;
    const completedAt = new Date();

    // Cap nhat session
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

    const skipProgress = passed
      ? await this.markCoveredUnitsCompleted(userId, session.config.units_covered)
      : null;

    await missionService.updateProgress(userId, "test-participation", 1);
    await missionService.updateProgress(userId, "checkpoint-first", 1);

    return {
      session_id: session.id,
      score: totalScore,
      total_possible: totalPossible,
      score_percentage: scorePercentage,
      pass_threshold: passThreshold,
      passing_score: passingScore,
      passed: passed,
      section_scores: sectionScores,
      section_details: sectionDetails,
      details_by_section: this.groupDetailsBySection(sectionDetails),
      skip_progress: skipProgress,
      time_spent_seconds: timeSpentSeconds,
      completed_at: completedAt,
    };
  }

  /**
   * Kiem tra dap an dung tuy theo loai cau hoi
   */
  checkAnswer(questionType, userAnswer, correctAnswer) {
    switch (questionType) {
      case "match":
        // Chon dap an: so sanh letter (A, B, C, D)
        const userChoice = (userAnswer.selected || userAnswer.choice || "").toUpperCase().trim();
        const correctChoice = (correctAnswer.selected || correctAnswer.choice || "").toUpperCase().trim();
        return userChoice === correctChoice;

      case "listen_write":
        // Chon dung + viet dung
        const selOk = (userAnswer.selected || "").toUpperCase().trim() === (correctAnswer.selected || "").toUpperCase().trim();
        const writeOk = isContextualTextMatch(
          userAnswer.written,
          correctAnswer.written,
          correctAnswer.acceptedAnswers || []
        );
        return selOk && writeOk;

      case "fill_blank":
        return this.checkFillBlankAnswer(userAnswer, correctAnswer);

      case "unscramble":
        // Sap xep tu: dung trat tu, khong bat buoc hoa thuong/dau cau.
        const unscrambled = normalizeAnswerText(userAnswer.answer || userAnswer || "");
        const unscrambledCorrect = normalizeAnswerText(correctAnswer.answer || correctAnswer || "");
        return unscrambled === unscrambledCorrect;

      case "read_speak":
        // Du lieu cu chi co confirmed:true; du lieu moi cham theo transcript noi ra.
        const spokenAnswer =
          typeof userAnswer === "string"
            ? userAnswer
            : userAnswer?.transcript || userAnswer?.answer || "";
        const spokenCandidates = getCandidateTexts(correctAnswer, correctAnswer?.acceptedAnswers || []);

        if (spokenCandidates.length) {
          const expectedSpoken =
            correctAnswer?.answer ||
            correctAnswer?.sampleAnswer ||
            correctAnswer?.correctAnswer ||
            correctAnswer;

          return isContextualTextMatch(
            spokenAnswer,
            expectedSpoken,
            correctAnswer?.acceptedAnswers || []
          );
        }

        return userAnswer === true || userAnswer?.confirmed === true || normalizeAnswerText(spokenAnswer).length > 0;

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

        return isExactTextMatch(submitted, expected);
      });
    }

    // Backward-compatible single blank format
    return isExactTextMatch(userAnswer?.answer ?? userAnswer, correctAnswer?.answer ?? correctAnswer);
  }

  groupDetailsBySection(sectionDetails = []) {
    return sectionDetails.reduce(
      (groups, detail) => {
        if (groups[detail.section]) {
          groups[detail.section].push(detail);
        }
        return groups;
      },
      { A: [], B: [], C: [], D: [], E: [] }
    );
  }

  /**
   * Khi user pass checkpoint, danh dau cac lesson trong unit duoc bao phu la completed.
   * Khong cong XP/stars de tranh tao thuong gia, chi mo khoa tien do unit tiep theo.
   */
  async markCoveredUnitsCompleted(userId, unitsCovered) {
    const unitIds = (parseJSON(unitsCovered) || [])
      .map((unitId) => Number(unitId))
      .filter((unitId) => Number.isInteger(unitId) && unitId > 0);

    if (!unitIds.length) {
      return { units_covered: [], units_completed: 0, lessons_completed: 0 };
    }

    const lessons = await Lesson.findAll({
      where: { unit_id: { [Op.in]: unitIds } },
      attributes: ["id", "unit_id"],
      order: [
        ["unit_id", "ASC"],
        ["order_index", "ASC"],
      ],
    });

    if (!lessons.length) {
      return { units_covered: unitIds, units_completed: 0, lessons_completed: 0 };
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
    const lessonsByUnitId = new Map();

    lessons.forEach((lesson) => {
      const unitId = Number(lesson.unit_id);
      if (!lessonsByUnitId.has(unitId)) lessonsByUnitId.set(unitId, []);
      lessonsByUnitId.get(unitId).push(lesson);
    });

    const wasUnitCompleted = new Map();
    lessonsByUnitId.forEach((unitLessons, unitId) => {
      wasUnitCompleted.set(
        unitId,
        unitLessons.every((lesson) => progressByLessonId.get(Number(lesson.id))?.status === "completed")
      );
    });

    const completedAt = new Date();
    let newlyCompletedLessons = 0;

    for (const lesson of lessons) {
      const lessonId = Number(lesson.id);
      const progress = progressByLessonId.get(lessonId);

      if (progress) {
        if (progress.status !== "completed") {
          newlyCompletedLessons += 1;
        }

        await progress.update({
          unit_id: lesson.unit_id,
          status: "completed",
          completed_at: completedAt,
          first_completed_at: progress.first_completed_at || completedAt,
        });
      } else {
        newlyCompletedLessons += 1;
        await LessonProgress.create({
          user_id: userId,
          unit_id: lesson.unit_id,
          lesson_id: lesson.id,
          status: "completed",
          stars_earned: 0,
          is_review: false,
          xp_earned: 0,
          correct_count: 0,
          total_count: 0,
          completed_at: completedAt,
          first_completed_at: completedAt,
        });
      }
    }

    let newlyCompletedUnits = 0;
    lessonsByUnitId.forEach((unitLessons, unitId) => {
      if (!wasUnitCompleted.get(unitId) && unitLessons.length > 0) {
        newlyCompletedUnits += 1;
      }
    });

    if (newlyCompletedLessons > 0 || newlyCompletedUnits > 0) {
      const [userProgress] = await UserProgress.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
      });

      userProgress.lessons_completed =
        (userProgress.lessons_completed || 0) + newlyCompletedLessons;
      userProgress.units_completed =
        (userProgress.units_completed || 0) + newlyCompletedUnits;
      await userProgress.save();
    }

    return {
      units_covered: unitIds,
      units_completed: newlyCompletedUnits,
      lessons_completed: newlyCompletedLessons,
    };
  }

  /**
   * Lay ket qua checkpoint
   */
  async getResult(sessionId, userId) {
    const session = await UnitTestSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
        test_type: "checkpoint",
      },
      include: [
        {
          model: UnitTestConfig,
          as: "config",
        },
      ],
    });

    if (!session) {
      throw new Error("Checkpoint session not found.");
    }

    if (session.status !== "completed") {
      throw new Error("Checkpoint has not been completed yet.");
    }

    // Lay cau hoi de hien thi noi dung
    const questions = await QuestionCheckpoint.findAll({
      where: {
        checkpoint_id: session.test_id,
        is_active: true,
      },
      order: [
        ["section", "ASC"],
        ["display_order", "ASC"],
      ],
    });

    // Map noi dung cau hoi vao section_details
    const questionMap = {};
    questions.forEach((q) => {
      questionMap[q.id] = q;
    });

    const sectionDetails = parseJSON(session.section_details);
    const normalizedSectionDetails = Array.isArray(sectionDetails) ? sectionDetails : [];

    const detailsWithContent = normalizedSectionDetails.map((detail) => {
      const question = questionMap[detail.questionId];
      return {
        questionId: detail.questionId,
        section: detail.section,
        questionType: detail.questionType,
        questionContent: question ? question.content : null,
        userAnswer: detail.userAnswer,
        correctAnswer: detail.correctAnswer,
        isCorrect: detail.isCorrect,
        score: detail.score,
      };
    });

    // Nhom chi tiet theo section
    const detailsBySection = { A: [], B: [], C: [], D: [], E: [] };
    detailsWithContent.forEach((d) => {
      if (detailsBySection[d.section]) {
        detailsBySection[d.section].push(d);
      }
    });

    const sectionScores = parseJSON(session.section_scores) || {};
    const totalPossible = Object.values(sectionScores).reduce(
      (sum, s) => sum + (s.total || 0),
      0
    );

    return {
      session_id: session.id,
      checkpoint_id: session.test_id,
      checkpoint_title: session.config?.title,
      score: session.score,
      total_possible: totalPossible,
      score_percentage: totalPossible > 0 ? Math.round((session.score / totalPossible) * 100) : 0,
      pass_threshold: session.config?.pass_threshold,
      passed: session.pass,
      section_scores: sectionScores,
      time_spent_seconds: session.time_spent_seconds,
      completed_at: session.completed_at,
      details_by_section: detailsBySection,
    };
  }

  /**
   * Lay lich su checkpoint cua user
   */
  async getHistory(userId, { limit = 10, page = 1 } = {}) {
    const offset = (page - 1) * limit;

    const { count, rows } = await UnitTestSession.findAndCountAll({
      where: {
        user_id: userId,
        test_type: "checkpoint",
      },
      include: [
        {
          model: UnitTestConfig,
          as: "config",
          attributes: ["id", "title", "units_covered"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return {
      sessions: rows.map((s) => ({
        session_id: s.id,
        checkpoint_id: s.test_id,
        checkpoint_title: s.config?.title,
        units_covered: s.units_covered,
        score: s.score,
        passed: s.pass,
        status: s.status,
        time_spent_seconds: s.time_spent_seconds,
        created_at: s.created_at,
        completed_at: s.completed_at,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Lay session hien tai (in_progress)
   */
  async getCurrentSession(userId, checkpointId) {
    const session = await UnitTestSession.findOne({
      where: {
        user_id: userId,
        test_id: checkpointId,
        test_type: "checkpoint",
        status: "in_progress",
      },
    });

    return session;
  }
}

module.exports = new CheckpointService();
