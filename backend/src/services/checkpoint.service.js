const {
  UnitTestConfig,
  UnitTestSession,
  QuestionCheckpoint,
  User,
} = require("../models");
const { Op } = require("sequelize");

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
      units_covered: c.units_covered,
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
      units_covered: config.units_covered,
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
    const sectionScores = { A: { correct: 0, total: 0 }, B: { correct: 0, total: 0 }, C: { correct: 0, total: 0 }, D: { correct: 0, total: 0 }, E: { correct: 0, total: 0 } };
    const sectionDetails = [];
    let totalScore = 0;
    let totalPossible = 0;

    // DEBUG: Log structure of answers object
    console.error("[DEBUG] answers param type:", typeof answers);
    console.error("[DEBUG] answers param keys:", Object.keys(answers));
    console.error("[DEBUG] answers['A']:", JSON.stringify(answers["A"]));
    console.error("[DEBUG] answers.A:", JSON.stringify(answers.A));
    console.error("[DEBUG] answers.A === answers['A']:", answers.A === answers["A"]);

    questions.forEach((q) => {
      const section = String(q.section); // Ensure section is always a string (ENUM can return number)
      const qIdStr = String(q.id);
      sectionScores[section].total += q.score;

      // DEBUG: log section lookup
      if (section === "A" && q.display_order === 1) {
        console.error("[DEBUG] FOR Q1: section=", section, "type=", typeof section, "q.section=", q.section);
        console.error("[DEBUG] FOR Q1: answers[section]=", JSON.stringify(answers[section]));
        console.error("[DEBUG] FOR Q1: answers['A']=", JSON.stringify(answers["A"]));
      }

      // Try number then string keys to handle both cases
      const userAnswer =
        answers[section]?.[qIdStr] ??
        answers[section]?.[Number(qIdStr)] ??
        null;

      // DEBUG: Log lookup for each question
      console.error(`[DEBUG] q${q.display_order}: section=${section}, qIdStr=${qIdStr}, answers[section]=${JSON.stringify(answers[section])?.substring(0,80)}, userAnswer=${JSON.stringify(userAnswer)}`);
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

    // Tinh % diem
    const scorePercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;
    const passThreshold = session.config.pass_threshold || 80;
    const passed = scorePercentage >= passThreshold;

    // Cap nhat session
    await session.update({
      answers_data: answers,
      score: totalScore,
      pass: passed,
      section_scores: sectionScores,
      section_details: sectionDetails,
      status: "completed",
      time_spent_seconds: timeSpentSeconds,
      completed_at: new Date(),
    });

    return {
      session_id: session.id,
      score: totalScore,
      total_possible: totalPossible,
      score_percentage: scorePercentage,
      pass_threshold: passThreshold,
      passed: passed,
      section_scores: sectionScores,
      time_spent_seconds: timeSpentSeconds,
      completed_at: session.completed_at,
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
        const writeOk = (userAnswer.written || "").toLowerCase().trim() === (correctAnswer.written || "").toLowerCase().trim();
        return selOk && writeOk;

      case "fill_blank":
        // Dien tu: so sanh khong phan biet hoa thuong
        const fillAns = (userAnswer.answer || userAnswer || "").toLowerCase().trim();
        const fillCorrect = (correctAnswer.answer || correctAnswer || "").toLowerCase().trim();
        return fillAns === fillCorrect;

      case "unscramble":
        // Sap xep tu: so sanh khong phan biet hoa thuong
        const unscrambled = (userAnswer.answer || userAnswer || "").toLowerCase().trim();
        const unscrambledCorrect = (correctAnswer.answer || correctAnswer || "").toLowerCase().trim();
        return unscrambled === unscrambledCorrect;

      case "read_speak":
        // Noi to: bat ky dap an nao cung duoc diem (voice confirmed)
        return userAnswer === true || userAnswer.confirmed === true;

      default:
        return false;
    }
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

    const detailsWithContent = (session.section_details || []).map((detail) => {
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

    const totalPossible = Object.values(session.section_scores || {}).reduce(
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
      section_scores: session.section_scores,
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
