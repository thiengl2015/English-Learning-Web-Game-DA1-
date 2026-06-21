const SIGNAL_CHECK_GAME_TYPE = "signal-check";

const PRACTICE_LESSON_GAME_TYPES = [
  "galaxy-match",
  "planetary-order",
  "rescue-mission",
  "voice-command",
];

const GAME_DEFAULTS = {
  "galaxy-match": {
    difficulty: "easy",
    questions_count: 6,
    time_limit: 120,
    passing_score: 70,
    xp_reward: 50,
  },
  "planetary-order": {
    difficulty: "medium",
    questions_count: 8,
    time_limit: 180,
    passing_score: 75,
    xp_reward: 75,
  },
  "rescue-mission": {
    difficulty: "medium",
    questions_count: 10,
    time_limit: 150,
    passing_score: 70,
    xp_reward: 60,
  },
  "signal-check": {
    difficulty: "hard",
    questions_count: 10,
    time_limit: 120,
    passing_score: 80,
    xp_reward: 100,
  },
  "voice-command": {
    difficulty: "medium",
    questions_count: 8,
    time_limit: 360,
    passing_score: 70,
    xp_reward: 80,
  },
};

const GAME_TYPES = Object.keys(GAME_DEFAULTS);

const parseMaybeJson = (value) => {
  if (Array.isArray(value) || value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

const hasAuthoredGameContent = (value) => {
  const parsed = parseMaybeJson(value);
  return Array.isArray(parsed) && parsed.filter(Boolean).length > 0;
};

const numericValue = (...values) => {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return null;
};

const getLessonOrder = (lesson) =>
  numericValue(lesson?.order_index, lesson?.lesson_order, lesson?.order);

const getUnitOrder = (lesson, unit) =>
  numericValue(
    unit?.order_index,
    unit?.unit_order,
    lesson?.unit?.order_index,
    lesson?.unit_order
  ) || 1;

const getLessonType = (lesson) => lesson?.type || lesson?.lesson_type || null;

const isSignalCheckLesson = (lesson) =>
  getLessonType(lesson) === "test" || getLessonOrder(lesson) === 5;

const getPracticeGameTypeForLesson = (lesson, unit) => {
  const lessonOrder = getLessonOrder(lesson) || 1;
  const unitOrder = getUnitOrder(lesson, unit);
  const lessonOffset =
    lessonOrder >= 1 && lessonOrder <= 4 ? lessonOrder - 1 : 0;
  const unitOffset = Math.max(0, unitOrder - 1);
  return PRACTICE_LESSON_GAME_TYPES[
    (lessonOffset + unitOffset) % PRACTICE_LESSON_GAME_TYPES.length
  ];
};

const getDefaultGameTypeForLesson = (lesson, unit) => {
  if (isSignalCheckLesson(lesson)) return SIGNAL_CHECK_GAME_TYPE;
  return getPracticeGameTypeForLesson(lesson, unit);
};

const isGameTypeAllowedForLesson = (lesson, gameType) => {
  if (!GAME_TYPES.includes(gameType)) return false;
  if (isSignalCheckLesson(lesson)) return gameType === SIGNAL_CHECK_GAME_TYPE;

  const lessonOrder = getLessonOrder(lesson);
  if (lessonOrder >= 1 && lessonOrder <= 4) {
    return PRACTICE_LESSON_GAME_TYPES.includes(gameType);
  }

  return true;
};

const dateValue = (value) => {
  const date = value ? new Date(value).getTime() : 0;
  return Number.isFinite(date) ? date : 0;
};

const pickPrimaryLessonGameConfig = (configs, lesson, unit) => {
  const rows = Array.isArray(configs) ? configs.filter(Boolean) : [];
  if (rows.length === 0) return null;

  const lessonContext = lesson || rows[0].lesson || rows[0];
  const unitContext = unit || rows[0].unit || rows[0];
  const preferred = getDefaultGameTypeForLesson(lessonContext, unitContext);

  return [...rows].sort((a, b) => {
    const allowedDiff =
      Number(isGameTypeAllowedForLesson(lessonContext, b.game_type)) -
      Number(isGameTypeAllowedForLesson(lessonContext, a.game_type));
    if (allowedDiff !== 0) return allowedDiff;

    const authoredDiff =
      Number(hasAuthoredGameContent(b.content)) -
      Number(hasAuthoredGameContent(a.content));
    if (authoredDiff !== 0) return authoredDiff;

    const preferredDiff =
      Number(b.game_type === preferred) - Number(a.game_type === preferred);
    if (preferredDiff !== 0) return preferredDiff;

    const updatedDiff = dateValue(b.updated_at) - dateValue(a.updated_at);
    if (updatedDiff !== 0) return updatedDiff;

    return Number(b.id) - Number(a.id);
  })[0];
};

module.exports = {
  GAME_DEFAULTS,
  GAME_TYPES,
  PRACTICE_LESSON_GAME_TYPES,
  SIGNAL_CHECK_GAME_TYPE,
  getDefaultGameTypeForLesson,
  hasAuthoredGameContent,
  isGameTypeAllowedForLesson,
  isSignalCheckLesson,
  parseMaybeJson,
  pickPrimaryLessonGameConfig,
};
