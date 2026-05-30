require("./backend/node_modules/dotenv").config({
  path: require("path").join(__dirname, "backend", ".env"),
});
const bcrypt = require("./backend/node_modules/bcryptjs");
const { User, UserProgress, Friendship, sequelize, Sequelize } = require("./backend/src/models");

const PASSWORD = "User123";

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
  },
];

const upsertSampleUser = async (sample) => {
  const existing = await User.findOne({ where: { email: sample.email } });
  const password_hash = await bcrypt.hash(PASSWORD, 10);

  const userData = {
    username: sample.username,
    email: sample.email,
    display_name: sample.display_name,
    native_language: "vi",
    current_level: "beginner",
    learning_goal: "daily",
    daily_goal: 20,
    status: "Active",
    role: "user",
    subscription: "Free",
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
    last_active_date: new Date().toISOString().slice(0, 10),
  };

  const progress = await UserProgress.findOne({ where: { user_id: user.id } });
  if (progress) {
    await progress.update(progressData);
  } else {
    await UserProgress.create(progressData);
  }

  return user;
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

const run = async () => {
  await sequelize.authenticate();
  await sequelize.sync();

  const users = [];
  for (const sample of sampleUsers) {
    users.push(await upsertSampleUser(sample));
  }

  await ensureFriendship(users[0], users[1]);
  await ensureFriendship(users[0], users[2]);
  await ensureFriendship(users[3], users[4]);

  console.log("Sample users are ready:");
  for (const sample of sampleUsers) {
    console.log(`- ${sample.display_name}: ${sample.email} / ${PASSWORD}`);
  }
};

run()
  .catch((error) => {
    console.error("Failed to add sample users:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
