"use strict";

const unitTopics = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    unit_id: 1,
    name: "Greetings & Basic Introductions",
    name_vi: "Loi chao va gioi thieu co ban",
    slug: "greetings-basics",
    icon: "U1",
    difficulty_range: "beginner",
    vocabulary_keywords: [
      "hello", "hi", "good morning", "goodbye", "name", "friend",
      "nice to meet you", "how are you", "fine", "thanks", "classmate",
      "introduce", "teacher", "student", "basic questions"
    ],
  },
  {
    id: "a1b2c3d4-0002-0000-0000-000000000002",
    unit_id: 2,
    name: "Family & Relationships",
    name_vi: "Gia dinh va cac moi quan he",
    slug: "family-friends",
    icon: "U2",
    difficulty_range: "beginner",
    vocabulary_keywords: [
      "family", "mother", "father", "sister", "brother", "grandmother",
      "grandfather", "friend", "best friend", "cousin", "aunt", "uncle",
      "birthday", "help", "share", "live with", "older", "younger"
    ],
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    unit_id: 3,
    name: "Daily Activities & Routines",
    name_vi: "Hoat dong hang ngay va thoi quen",
    slug: "daily-life",
    icon: "U3",
    difficulty_range: "beginner",
    vocabulary_keywords: [
      "wake up", "brush teeth", "eat breakfast", "go to school",
      "come home", "do homework", "watch TV", "go to bed",
      "morning routine", "evening routine", "daily activities",
      "household chores", "time expressions", "always", "usually", "sometimes"
    ],
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    unit_id: 4,
    name: "Food & Drinks",
    name_vi: "Do an va do uong",
    slug: "food-drinks",
    icon: "U4",
    difficulty_range: "beginner",
    vocabulary_keywords: [
      "breakfast", "lunch", "dinner", "snack", "restaurant",
      "menu", "order", "delicious", "hungry", "thirsty",
      "fork", "knife", "spoon", "plate", "glass", "meal", "cook", "drink"
    ],
  },
  {
    id: "a1b2c3d4-0005-0000-0000-000000000005",
    unit_id: 5,
    name: "Shopping & Money",
    name_vi: "Mua sam va tien bac",
    slug: "shopping-money",
    icon: "U5",
    difficulty_range: "beginner",
    vocabulary_keywords: [
      "shop", "store", "buy", "sell", "price", "cheap", "expensive",
      "size", "color", "clothes", "shoes", "gift", "money", "pay",
      "cash", "card", "mall", "sale", "bag", "receipt"
    ],
  },
  {
    id: "a1b2c3d4-0006-0000-0000-000000000006",
    unit_id: 6,
    name: "Travel & Transportation",
    name_vi: "Du lich va giao thong",
    slug: "travel-transportation",
    icon: "U6",
    difficulty_range: "beginner",
    vocabulary_keywords: [
      "airport", "plane", "train", "bus", "taxi", "hotel",
      "passport", "ticket", "luggage", "travel", "vacation",
      "destination", "departure", "arrival", "booking", "tourist", "station"
    ],
  },
  {
    id: "a1b2c3d4-0007-0000-0000-000000000007",
    unit_id: 7,
    name: "Weather & Seasons",
    name_vi: "Thoi tiet va cac mua",
    slug: "weather-seasons",
    icon: "U7",
    difficulty_range: "beginner",
    vocabulary_keywords: [
      "sunny", "rainy", "cloudy", "windy", "snowy", "hot", "cold",
      "spring", "summer", "autumn", "winter", "weather", "forecast",
      "temperature", "rain", "snow", "wind", "sky", "season"
    ],
  },
  {
    id: "a1b2c3d4-0008-0000-0000-000000000008",
    unit_id: 8,
    name: "Home & Living",
    name_vi: "Nha cua va doi song",
    slug: "home-living",
    icon: "U8",
    difficulty_range: "beginner",
    vocabulary_keywords: [
      "home", "house", "apartment", "bedroom", "kitchen", "bathroom",
      "living room", "garden", "chair", "table", "window", "door",
      "near", "next to", "across from", "clean", "room", "furniture"
    ],
  },
  {
    id: "a1b2c3d4-0009-0000-0000-000000000009",
    unit_id: 9,
    name: "Work & Career",
    name_vi: "Cong viec va nghe nghiep",
    slug: "work-career",
    icon: "U9",
    difficulty_range: "intermediate",
    vocabulary_keywords: [
      "job", "career", "doctor", "teacher", "engineer", "chef",
      "pilot", "worker", "office", "salary", "work", "earn",
      "future", "dream", "goal", "plan", "interview", "skill", "meeting"
    ],
  },
  {
    id: "a1b2c3d4-0010-0000-0000-000000000010",
    unit_id: 10,
    name: "Health & Fitness",
    name_vi: "Suc khoe va the chat",
    slug: "health-fitness",
    icon: "U10",
    difficulty_range: "intermediate",
    vocabulary_keywords: [
      "headache", "stomachache", "fever", "cold", "doctor", "medicine",
      "hospital", "healthy", "exercise", "sleep", "rest", "head",
      "hand", "foot", "eye", "ear", "body", "fit", "tired", "water"
    ],
  },
  {
    id: "a1b2c3d4-0011-0000-0000-000000000011",
    unit_id: 11,
    name: "Technology & Internet",
    name_vi: "Cong nghe va internet",
    slug: "technology-internet",
    icon: "U11",
    difficulty_range: "intermediate",
    vocabulary_keywords: [
      "computer", "phone", "tablet", "internet", "email", "game",
      "app", "screen", "keyboard", "mouse", "camera", "photo",
      "video", "social media", "message", "download", "upload", "wifi"
    ],
  },
  {
    id: "a1b2c3d4-0012-0000-0000-000000000012",
    unit_id: 12,
    name: "Entertainment & Hobbies",
    name_vi: "Giai tri va so thich",
    slug: "entertainment-hobbies",
    icon: "U12",
    difficulty_range: "intermediate",
    vocabulary_keywords: [
      "movie", "music", "song", "singer", "game", "hobby", "interest",
      "football", "basketball", "swimming", "cycling", "running",
      "draw", "sing", "dance", "read", "concert", "favorite", "team"
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rows = unitTopics.map((topic, index) => ({
      id: topic.id,
      name: topic.name,
      name_vi: topic.name_vi,
      slug: topic.slug,
      icon: topic.icon,
      difficulty_range: topic.difficulty_range,
      min_age: 8,
      max_age: 18,
      unit_id: topic.unit_id,
      unit_order: index + 1,
      vocabulary_keywords: JSON.stringify(topic.vocabulary_keywords),
      is_active: true,
      created_at: now,
      updated_at: now,
    }));

    await queryInterface.bulkDelete("placement_topics", null, {});
    await queryInterface.bulkInsert("placement_topics", rows, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("placement_topics", null, {});
  },
};
