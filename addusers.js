require("./backend/node_modules/dotenv").config({
  path: require("path").join(__dirname, "backend", ".env"),
});

const bcrypt = require("./backend/node_modules/bcryptjs");
const {
  Conversation,
  ConversationMessage,
  DirectMessage,
  Friendship,
  Lesson,
  LessonProgress,
  Mission,
  User,
  UserMission,
  UserProgress,
  UserSetting,
  UserVocabulary,
  Vocabulary,
  sequelize,
  Sequelize,
} = require("./backend/src/models");

const PASSWORD = "User123";
const DAY_MS = 24 * 60 * 60 * 1000;

const daysAgo = (days) => new Date(Date.now() - days * DAY_MS);

const daysFromNow = (days) => new Date(Date.now() + days * DAY_MS);

const todayStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const sampleUsers = [
  {
    username: "cosmos_arya",
    email: "cosmos.arya@test.local",
    display_name: "Cosmos Arya",
    total_xp: 4200,
    weekly_xp: 760,
    xp_this_week: 760,
    level: 5,
    streak_days: 9,
    words_learned: 96,
    total_study_minutes: 340,
    units_completed: 3,
    lessons_completed: 18,
    league: "Bronze",
    current_level: "beginner",
    learning_goal: "daily",
    daily_goal: 20,
    subscription: "Free",
    lessonRows: 8,
    completedLessonRows: 6,
    vocabularyRows: 18,
    favoriteEvery: 4,
    lastActiveDaysAgo: 0,
    settings: { music_volume: 55, audio_volume: 85, dark_mode: false },
  },
  {
    username: "nebula_minh",
    email: "nebula.minh@test.local",
    display_name: "Nebula Minh",
    total_xp: 9800,
    weekly_xp: 1420,
    xp_this_week: 1420,
    level: 10,
    streak_days: 15,
    words_learned: 180,
    total_study_minutes: 720,
    units_completed: 6,
    lessons_completed: 35,
    league: "Silver",
    current_level: "intermediate",
    learning_goal: "toeic",
    daily_goal: 25,
    subscription: "Premium",
    premium_expires_at: daysFromNow(45),
    lessonRows: 10,
    completedLessonRows: 8,
    vocabularyRows: 24,
    favoriteEvery: 5,
    lastActiveDaysAgo: 1,
    settings: { music_volume: 65, audio_volume: 80, dark_mode: true },
  },
  {
    username: "orbit_linh",
    email: "orbit.linh@test.local",
    display_name: "Orbit Linh",
    total_xp: 15300,
    weekly_xp: 2360,
    xp_this_week: 2360,
    level: 16,
    streak_days: 21,
    words_learned: 260,
    total_study_minutes: 1180,
    units_completed: 8,
    lessons_completed: 49,
    league: "Gold",
    current_level: "intermediate",
    learning_goal: "ielts",
    daily_goal: 30,
    subscription: "Premium",
    premium_expires_at: daysFromNow(90),
    lessonRows: 12,
    completedLessonRows: 10,
    vocabularyRows: 30,
    favoriteEvery: 6,
    lastActiveDaysAgo: 0,
    settings: { music_volume: 45, audio_volume: 90, dark_mode: false },
  },
  {
    username: "stellar_khoa",
    email: "stellar.khoa@test.local",
    display_name: "Stellar Khoa",
    total_xp: 22100,
    weekly_xp: 3180,
    xp_this_week: 3180,
    level: 23,
    streak_days: 34,
    words_learned: 410,
    total_study_minutes: 1740,
    units_completed: 11,
    lessons_completed: 68,
    league: "Diamond",
    current_level: "advanced",
    learning_goal: "academic",
    daily_goal: 45,
    subscription: "Super",
    premium_expires_at: daysFromNow(120),
    lessonRows: 14,
    completedLessonRows: 12,
    vocabularyRows: 36,
    favoriteEvery: 7,
    lastActiveDaysAgo: 2,
    settings: { music_volume: 70, audio_volume: 75, dark_mode: true },
  },
  {
    username: "lunar_trang",
    email: "lunar.trang@test.local",
    display_name: "Lunar Trang",
    total_xp: 6700,
    weekly_xp: 520,
    xp_this_week: 520,
    level: 7,
    streak_days: 5,
    words_learned: 130,
    total_study_minutes: 455,
    units_completed: 4,
    lessons_completed: 22,
    league: "Bronze",
    current_level: "beginner",
    learning_goal: "travel",
    daily_goal: 15,
    subscription: "Free",
    lessonRows: 7,
    completedLessonRows: 4,
    vocabularyRows: 16,
    favoriteEvery: 3,
    lastActiveDaysAgo: 0,
    settings: { music_volume: 35, audio_volume: 85, dark_mode: false },
  },
];

const sampleConversations = [
  {
    topic: "daily-life",
    topic_title: "Daily Practice Plan",
    messages: [
      ["user", "I want a simple daily English practice plan."],
      [
        "assistant",
        "Start with five new words, one short listening activity, and two speaking sentences.",
      ],
      ["user", "Can you make it easier for a beginner?"],
      [
        "assistant",
        "Yes. Use familiar topics first: greetings, family, food, and school routines.",
      ],
    ],
  },
  {
    topic: "travel",
    topic_title: "Travel Phrases Review",
    messages: [
      ["user", "Help me practice travel phrases."],
      [
        "assistant",
        "Great. Try: Could you tell me where the bus station is?",
      ],
      ["user", "Could you tell me where the bus station is?"],
      ["assistant", "Perfect. Now ask for the price of a ticket."],
    ],
  },
];

const addColumnIfMissing = async (queryInterface, tableName, columnName, definition) => {
  try {
    const columns = await queryInterface.describeTable(tableName);
    if (!columns[columnName]) {
      await queryInterface.addColumn(tableName, columnName, definition);
    }
  } catch (error) {
    if (!/doesn't exist|Unknown table|No description found/i.test(error.message)) {
      throw error;
    }
  }
};

const ensureSampleSchema = async () => {
  const queryInterface = sequelize.getQueryInterface();

  await addColumnIfMissing(queryInterface, "users", "premium_expires_at", {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await addColumnIfMissing(queryInterface, "users", "subscription_cancelled_at", {
    type: Sequelize.DATE,
    allowNull: true,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "xp_this_week", {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "words_learned", {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "total_study_minutes", {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "units_completed", {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "user_progress", "lessons_completed", {
    type: Sequelize.INTEGER,
    defaultValue: 0,
  });
};

const upsertSampleUser = async (sample) => {
  const existing = await User.findOne({ where: { email: sample.email } });
  const password_hash = await bcrypt.hash(PASSWORD, 10);
  const lastActive = daysAgo(sample.lastActiveDaysAgo || 0);

  const userData = {
    username: sample.username,
    email: sample.email,
    display_name: sample.display_name,
    avatar: null,
    level: sample.level,
    subscription: sample.subscription,
    premium_expires_at: sample.premium_expires_at || null,
    subscription_cancelled_at: sample.subscription_cancelled_at || null,
    native_language: "vi",
    current_level: sample.current_level,
    learning_goal: sample.learning_goal,
    daily_goal: sample.daily_goal,
    joined_date: daysAgo(45 + sample.level),
    status: "Active",
    last_active: lastActive,
    role: "user",
    reset_token: null,
    reset_token_expires: null,
  };

  let user = existing;
  if (user) {
    await user.update({ ...userData, password_hash });
  } else {
    user = await User.create({ ...userData, password_hash: PASSWORD });
  }

  const progressData = {
    user_id: user.id,
    total_xp: sample.total_xp,
    weekly_xp: sample.weekly_xp,
    xp_this_week: sample.xp_this_week,
    level: sample.level,
    streak_days: sample.streak_days,
    words_learned: sample.words_learned,
    total_study_minutes: sample.total_study_minutes,
    units_completed: sample.units_completed,
    lessons_completed: sample.lessons_completed,
    league: sample.league,
    last_active_date: lastActive.toISOString().slice(0, 10),
  };

  const progress = await UserProgress.findOne({ where: { user_id: user.id } });
  if (progress) {
    await progress.update(progressData);
  } else {
    await UserProgress.create(progressData);
  }

  await ensureUserSettings(user.id, sample.settings);

  return user;
};

const ensureUserSettings = async (userId, settings = {}) => {
  const settingsData = {
    user_id: userId,
    push_notifications: true,
    email_reminders: true,
    sound_effects: true,
    background_music: true,
    music_volume: 70,
    audio_volume: 80,
    dark_mode: false,
    ...settings,
  };

  const [record] = await UserSetting.findOrCreate({
    where: { user_id: userId },
    defaults: settingsData,
  });
  await record.update(settingsData);
};

const getMissionProgress = (sample, mission) => {
  switch (mission.code) {
    case "login":
      return 1;
    case "flashcard":
      return sample.vocabularyRows > 0 ? 1 : 0;
    case "new-level":
      return sample.level > 1 ? 1 : 0;
    case "new-lesson":
      return Math.min(sample.lessons_completed, mission.target);
    case "daily-goal":
      return Math.min(sample.daily_goal, Math.max(0, Math.round(sample.daily_goal * 0.8)));
    case "unit-5":
    case "unit-10":
    case "unit-20":
      return Math.min(sample.units_completed, mission.target);
    case "words-50":
    case "words-100":
    case "words-500":
      return Math.min(sample.words_learned, mission.target);
    case "streak-10":
    case "streak-30":
    case "streak-50":
    case "streak-100":
      return Math.min(sample.streak_days, mission.target);
    case "study-60":
    case "study-120":
    case "study-360":
    case "study-600":
      return Math.min(sample.total_study_minutes, mission.target);
    default:
      return 0;
  }
};

const ensureUserMissions = async (userId, sample, missions) => {
  for (const mission of missions) {
    const resetDate = mission.reset_daily ? todayStart() : null;
    const target = mission.code === "daily-goal" ? sample.daily_goal : mission.target;
    const progress = getMissionProgress(sample, mission);
    const status = progress >= target ? "completed" : "in_progress";

    const where = {
      user_id: userId,
      mission_id: mission.id,
      reset_date: resetDate,
    };

    const data = {
      user_id: userId,
      mission_id: mission.id,
      progress,
      status,
      claimed_at: null,
      last_updated: new Date(),
      reset_date: resetDate,
    };

    const existing = await UserMission.findOne({ where });
    if (existing) {
      await existing.update(data);
    } else {
      await UserMission.create(data);
    }
  }
};

const ensureLessonProgress = async (userId, sample, lessons, sampleIndex) => {
  const selectedLessons = lessons.slice(0, sample.lessonRows || 0);

  for (let index = 0; index < selectedLessons.length; index += 1) {
    const lesson = selectedLessons[index];
    const isCompleted = index < sample.completedLessonRows;
    const isCurrent = index === sample.completedLessonRows;
    const status = isCompleted ? "completed" : isCurrent ? "in-progress" : "locked";
    const completedAt = isCompleted ? daysAgo(index + sampleIndex) : null;

    const data = {
      user_id: userId,
      unit_id: lesson.unit_id,
      lesson_id: lesson.id,
      status,
      stars_earned: isCompleted ? 2 + ((index + sampleIndex) % 2) : 0,
      is_review: isCompleted && index % 4 === 0,
      xp_earned: isCompleted ? 25 + ((index + sampleIndex) % 4) * 5 : 0,
      correct_count: isCompleted ? 7 + ((index + sampleIndex) % 4) : isCurrent ? 3 : 0,
      total_count: isCompleted || isCurrent ? 10 : 0,
      completed_at: completedAt,
      first_completed_at: isCompleted ? daysAgo(index + sampleIndex + 7) : null,
    };

    const existing = await LessonProgress.findOne({
      where: { user_id: userId, lesson_id: lesson.id },
    });

    if (existing) {
      await existing.update(data);
    } else {
      await LessonProgress.create(data);
    }
  }
};

const ensureUserVocabulary = async (userId, sample, vocabulary, sampleIndex) => {
  const selectedVocabulary = vocabulary.slice(0, sample.vocabularyRows || 0);

  for (let index = 0; index < selectedVocabulary.length; index += 1) {
    const vocab = selectedVocabulary[index];
    const masteryLevel = Math.min(5, 1 + ((index + sampleIndex) % 5));
    const data = {
      user_id: userId,
      vocab_id: vocab.id,
      is_favorite: index % (sample.favoriteEvery || 5) === 0,
      mastery_level: masteryLevel,
      correct_count: masteryLevel * 2 + sampleIndex,
      incorrect_count: (index + sampleIndex) % 3,
      last_reviewed: daysAgo((index % 7) + sampleIndex),
    };

    const existing = await UserVocabulary.findOne({
      where: { user_id: userId, vocab_id: vocab.id },
    });

    if (existing) {
      await existing.update(data);
    } else {
      await UserVocabulary.create(data);
    }
  }
};

const ensureAssistantConversation = async (userId, sampleIndex) => {
  const template = sampleConversations[sampleIndex % sampleConversations.length];
  const startedAt = daysAgo(sampleIndex + 1);
  const [conversation] = await Conversation.findOrCreate({
    where: { user_id: userId, topic: template.topic },
    defaults: {
      user_id: userId,
      topic: template.topic,
      topic_title: template.topic_title,
      status: "active",
      total_messages: template.messages.length,
      duration_seconds: 240 + sampleIndex * 30,
      started_at: startedAt,
    },
  });

  await conversation.update({
    topic_title: template.topic_title,
    status: "active",
    total_messages: template.messages.length,
    duration_seconds: 240 + sampleIndex * 30,
    started_at: startedAt,
    ended_at: null,
  });

  await ConversationMessage.destroy({ where: { conversation_id: conversation.id } });

  await ConversationMessage.bulkCreate(
    template.messages.map(([role, content], messageIndex) => ({
      conversation_id: conversation.id,
      role,
      content,
      tokens_used: role === "assistant" ? 32 + messageIndex : 0,
      created_at: new Date(startedAt.getTime() + messageIndex * 60 * 1000),
    }))
  );
};

const ensureFriendship = async (userA, userB) => {
  const existing = await Friendship.findOne({
    where: {
      [Sequelize.Op.or]: [
        { requester_id: userA.id, addressee_id: userB.id },
        { requester_id: userB.id, addressee_id: userA.id },
      ],
    },
  });

  if (existing) {
    await existing.update({ status: "accepted" });
    return;
  }

  await Friendship.create({
    requester_id: userA.id,
    addressee_id: userB.id,
    status: "accepted",
  });
};

const ensureDirectMessagePair = async (userA, userB) => {
  const existingCount = await DirectMessage.count({
    where: {
      [Sequelize.Op.or]: [
        { sender_id: userA.id, receiver_id: userB.id },
        { sender_id: userB.id, receiver_id: userA.id },
      ],
    },
  });

  if (existingCount > 0) {
    return;
  }

  await DirectMessage.bulkCreate([
    {
      sender_id: userA.id,
      receiver_id: userB.id,
      type: "text",
      content: "Ready for today's English practice?",
      read_at: new Date(),
      created_at: daysAgo(1),
    },
    {
      sender_id: userB.id,
      receiver_id: userA.id,
      type: "text",
      content: "Yes, let's review vocabulary and one short conversation.",
      read_at: null,
      created_at: new Date(daysAgo(1).getTime() + 5 * 60 * 1000),
    },
  ]);
};

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureSampleSchema();

  const [lessons, vocabulary, missions] = await Promise.all([
    Lesson.findAll({
      order: [
        ["unit_id", "ASC"],
        ["order_index", "ASC"],
        ["id", "ASC"],
      ],
    }),
    Vocabulary.findAll({ order: [["id", "ASC"]] }),
    Mission.findAll({
      where: { is_active: true },
      order: [
        ["type", "ASC"],
        ["order_index", "ASC"],
      ],
    }),
  ]);

  const users = [];
  for (let index = 0; index < sampleUsers.length; index += 1) {
    const sample = sampleUsers[index];
    const user = await upsertSampleUser(sample);

    if (missions.length > 0) {
      await ensureUserMissions(user.id, sample, missions);
    }

    if (lessons.length > 0) {
      await ensureLessonProgress(user.id, sample, lessons, index);
    }

    if (vocabulary.length > 0) {
      await ensureUserVocabulary(user.id, sample, vocabulary, index);
    }

    await ensureAssistantConversation(user.id, index);
    users.push(user);
  }

  await ensureFriendship(users[0], users[1]);
  await ensureFriendship(users[0], users[2]);
  await ensureFriendship(users[3], users[4]);
  await ensureDirectMessagePair(users[0], users[1]);
  await ensureDirectMessagePair(users[0], users[2]);
  await ensureDirectMessagePair(users[3], users[4]);

  console.log("Sample users are ready:");
  for (const sample of sampleUsers) {
    console.log(`- ${sample.display_name}: ${sample.email} / ${PASSWORD}`);
  }
  console.log(
    `Seeded related data: settings, ${
      missions.length ? "missions" : "no missions found"
    }, ${lessons.length ? "lesson progress" : "no lessons found"}, ${
      vocabulary.length ? "vocabulary progress" : "no vocabulary found"
    }, assistant history, friendships, and direct messages.`
  );
};

run()
  .catch((error) => {
    console.error("Failed to add sample users:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
