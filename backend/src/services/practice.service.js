const {
  PracticeTopic,
  PracticeItem,
  PracticeAttempt,
  PracticeProgress,
  UserProgress,
} = require("../models");
const { Op } = require("sequelize");
const userService = require("./user.service");
const missionService = require("./mission.service");

const MODES = [
  {
    mode: "listen-fill",
    label: "Listen & Fill",
    description: "Listen and fill in missing words",
  },
  {
    mode: "listen-repeat",
    label: "Listen & Repeat",
    description: "Listen, speak, and match pronunciation",
  },
  {
    mode: "read-answer",
    label: "Read & Answer",
    description: "Read passages and answer true or false questions",
  },
  {
    mode: "read-story",
    label: "Read Story",
    description: "Read short stories and reveal translations",
  },
];

const MODE_VALUES = MODES.map((item) => item.mode);

function parseContentData(value) {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof value === "object" && !Array.isArray(value) ? value : {};
}

function getPracticeSkillMissionCode(mode) {
  if (mode === "listen-fill") return "practice-listening";
  if (mode === "listen-repeat") return "practice-speaking";
  if (mode === "read-answer" || mode === "read-story") return "practice-reading";
  return null;
}

class PracticeService {
  validateMode(mode) {
    if (!MODE_VALUES.includes(mode)) {
      throw new Error("Practice mode not found");
    }
  }

  getModes() {
    return MODES;
  }

  async getTopicOrThrow(mode, slug) {
    this.validateMode(mode);

    const topic = await PracticeTopic.findOne({
      where: { mode, slug, is_active: true },
      include: [
        {
          model: PracticeItem,
          as: "items",
          separate: true,
          order: [["order_index", "ASC"]],
        },
      ],
    });

    if (!topic) {
      throw new Error("Practice topic not found");
    }

    return topic;
  }

  serializeTopic(topic, progress = null, totalItems = null) {
    const total = totalItems ?? topic.items?.length ?? progress?.total_items ?? 0;
    const completed = Math.min(progress?.completed_items || 0, total);
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: topic.id,
      mode: topic.mode,
      slug: topic.slug,
      title: topic.title,
      description: topic.description,
      emoji: topic.emoji,
      color: topic.color,
      imageUrl: topic.image_url,
      orderIndex: topic.order_index,
      total,
      completed,
      progressPercent,
      bestScore: progress?.best_score || 0,
      attemptsCount: progress?.attempts_count || 0,
      completedAt: progress?.completed_at || null,
    };
  }

  serializeItem(item) {
    const contentData = parseContentData(item.content_data);

    return {
      id: item.id,
      orderIndex: item.order_index,
      title: item.title,
      prompt: item.prompt,
      passage: item.passage,
      imageUrl: item.image_url,
      audioText: item.audio_text,
      translation: item.translation,
      contentData,
      content_data: contentData,
    };
  }

  async getTopics(mode, userId) {
    this.validateMode(mode);

    const topics = await PracticeTopic.findAll({
      where: { mode, is_active: true },
      include: [
        {
          model: PracticeItem,
          as: "items",
          attributes: ["id"],
        },
      ],
      order: [["order_index", "ASC"]],
    });

    const topicIds = topics.map((topic) => topic.id);
    const progressRows = await PracticeProgress.findAll({
      where: {
        user_id: userId,
        topic_id: { [Op.in]: topicIds.length ? topicIds : [""] },
      },
    });
    const progressByTopicId = new Map(progressRows.map((row) => [row.topic_id, row]));

    return topics.map((topic) =>
      this.serializeTopic(topic, progressByTopicId.get(topic.id), topic.items?.length || 0)
    );
  }

  async getTopicDetail(mode, slug, userId) {
    const topic = await this.getTopicOrThrow(mode, slug);
    const progress = await PracticeProgress.findOne({
      where: { user_id: userId, topic_id: topic.id },
    });
    const nextTopic = await PracticeTopic.findOne({
      where: {
        mode,
        is_active: true,
        order_index: { [Op.gt]: topic.order_index },
      },
      order: [["order_index", "ASC"]],
    });
    const firstTopic = nextTopic
      ? null
      : await PracticeTopic.findOne({
          where: { mode, is_active: true },
          order: [["order_index", "ASC"]],
        });

    return {
      topic: this.serializeTopic(topic, progress, topic.items.length),
      items: topic.items.map((item) => this.serializeItem(item)),
      progress: progress
        ? {
            completedItems: progress.completed_items,
            totalItems: progress.total_items || topic.items.length,
            bestScore: progress.best_score,
            attemptsCount: progress.attempts_count,
            lastAttemptAt: progress.last_attempt_at,
            completedAt: progress.completed_at,
          }
        : {
            completedItems: 0,
            totalItems: topic.items.length,
            bestScore: 0,
            attemptsCount: 0,
            lastAttemptAt: null,
            completedAt: null,
          },
      nextTopicSlug: (nextTopic || firstTopic)?.slug || null,
    };
  }

  async startAttempt(mode, slug, userId) {
    const topic = await this.getTopicOrThrow(mode, slug);

    const existingAttempt = await PracticeAttempt.findOne({
      where: {
        user_id: userId,
        topic_id: topic.id,
        mode,
        status: "in-progress",
      },
      order: [["started_at", "DESC"]],
    });

    if (existingAttempt) {
      return {
        attemptId: existingAttempt.id,
        startedAt: existingAttempt.started_at,
        totalCount: topic.items.length,
      };
    }

    const attempt = await PracticeAttempt.create({
      user_id: userId,
      topic_id: topic.id,
      mode,
      total_count: topic.items.length,
      status: "in-progress",
    });

    return {
      attemptId: attempt.id,
      startedAt: attempt.started_at,
      totalCount: topic.items.length,
    };
  }

  calculateXP(score) {
    if (score >= 90) return 120;
    if (score >= 70) return 80;
    if (score >= 50) return 40;
    return 10;
  }

  async completeAttempt(attemptId, userId, payload) {
    const attempt = await PracticeAttempt.findOne({
      where: { id: attemptId, user_id: userId },
      include: [{ model: PracticeTopic, as: "topic" }],
    });

    if (!attempt) {
      throw new Error("Practice attempt not found");
    }

    if (attempt.status !== "in-progress") {
      throw new Error("Practice attempt is not active");
    }

    const correctCount = Math.max(0, Number(payload.correctCount || 0));
    const totalCount = Math.max(1, Number(payload.totalCount || attempt.total_count || 1));
    const completedItems = Math.max(0, Number(payload.completedItems || 0));
    const timeSpent = Math.max(0, Number(payload.timeSpent || 0));
    const score = Math.round((correctCount / totalCount) * 100);

    const totalItems = await PracticeItem.count({ where: { topic_id: attempt.topic_id } });
    const [progress] = await PracticeProgress.findOrCreate({
      where: {
        user_id: userId,
        topic_id: attempt.topic_id,
      },
      defaults: {
        user_id: userId,
        topic_id: attempt.topic_id,
        completed_items: 0,
        total_items: totalItems,
      },
    });

    const isReview = Boolean(progress.completed_at);
    const baseXP = this.calculateXP(score);
    const xpEarned = isReview ? Math.round(baseXP * 0.5) : baseXP;
    const now = new Date();
    const boundedCompletedItems = Math.min(completedItems, totalItems);
    const wasCompleted = Boolean(progress.completed_at);
    const isCompleted = boundedCompletedItems >= totalItems;

    await attempt.update({
      status: "completed",
      score,
      correct_count: correctCount,
      total_count: totalCount,
      time_spent: timeSpent,
      xp_earned: xpEarned,
      answers: payload.answers || null,
      completed_at: now,
    });

    progress.completed_items = Math.max(progress.completed_items || 0, boundedCompletedItems);
    progress.total_items = totalItems;
    progress.best_score = Math.max(progress.best_score || 0, score);
    progress.attempts_count = (progress.attempts_count || 0) + 1;
    progress.last_attempt_at = now;
    if (isCompleted && !progress.completed_at) {
      progress.completed_at = now;
    }
    await progress.save();

    if (xpEarned > 0) {
      await userService.addXP(userId, xpEarned);
    }

    const studyMinutes = Math.max(0, Math.ceil(timeSpent / 60));
    if (studyMinutes > 0) {
      const [userProgress] = await UserProgress.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
      });
      userProgress.total_study_minutes = (userProgress.total_study_minutes || 0) + studyMinutes;
      await userProgress.save();
      await missionService.updateProgress(userId, "daily-goal", studyMinutes);
    }

    await missionService.updateProgress(userId, "flashcard", 1);

    const skillMissionCode = getPracticeSkillMissionCode(attempt.mode);
    if (skillMissionCode) {
      await missionService.updateProgress(userId, skillMissionCode, 1);
    }

    if (isCompleted && !wasCompleted) {
      await missionService.updateProgress(userId, "practice-topic-1", 1);
      await missionService.updateProgress(userId, "practice-topic-5", 1);
      await missionService.updateProgress(userId, "practice-topic-10", 1);
    }

    return {
      attemptId: attempt.id,
      status: "completed",
      score,
      correctCount,
      totalCount,
      completedItems: progress.completed_items,
      totalItems,
      xpEarned,
      isReview,
      firstCompletion: isCompleted && !wasCompleted,
      completed: Boolean(progress.completed_at),
      progress: {
        completedItems: progress.completed_items,
        totalItems: progress.total_items,
        bestScore: progress.best_score,
        attemptsCount: progress.attempts_count,
        lastAttemptAt: progress.last_attempt_at,
        completedAt: progress.completed_at,
      },
    };
  }
}

module.exports = new PracticeService();
