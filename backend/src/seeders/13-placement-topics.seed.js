"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const topics = [
      {
        id: "a1b2c3d4-0001-0000-0000-000000000001",
        name: "Daily Life",
        name_vi: "Cuộc sống hàng ngày",
        slug: "daily-life",
        icon: "🏠",
        difficulty_range: "beginner",
        min_age: 8,
        max_age: 18,
        vocabulary_keywords: [
          "wake up", "brush teeth", "eat breakfast", "go to school",
          "come home", "do homework", "watch TV", "go to bed",
          "morning routine", "evening routine", "daily activities",
          "household chores", "time expressions", "频率副词"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0002-0000-0000-000000000002",
        name: "School Life",
        name_vi: "Cuộc sống học đường",
        slug: "school-life",
        icon: "🏫",
        difficulty_range: "beginner",
        min_age: 8,
        max_age: 15,
        vocabulary_keywords: [
          "school", "classroom", "teacher", "student", "book", "pencil",
          "homework", "exam", "subject", "math", "science", "history",
          "art", "music", "break time", "school bus", "friend", "lesson"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0003-0000-0000-000000000003",
        name: "Travel",
        name_vi: "Du lịch & Giao thông",
        slug: "travel",
        icon: "✈️",
        difficulty_range: "beginner",
        min_age: 10,
        max_age: 18,
        vocabulary_keywords: [
          "airport", "plane", "train", "bus", "taxi", "hotel",
          "passport", "ticket", "luggage", "travel", "vacation",
          "destination", "departure", "arrival", "booking", "tourist"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0004-0000-0000-000000000004",
        name: "Food & Restaurants",
        name_vi: "Đồ ăn & Nhà hàng",
        slug: "food-restaurants",
        icon: "🍕",
        difficulty_range: "beginner",
        min_age: 8,
        max_age: 18,
        vocabulary_keywords: [
          "breakfast", "lunch", "dinner", "snack", "restaurant",
          "menu", "order", "delicious", "delicious", "hungry", "thirsty",
          "fork", "knife", "spoon", "plate", "glass", "meal", "cook"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0005-0000-0000-000000000005",
        name: "Sports & Hobbies",
        name_vi: "Thể thao & Sở thích",
        slug: "sports-hobbies",
        icon: "⚽",
        difficulty_range: "beginner",
        min_age: 8,
        max_age: 18,
        vocabulary_keywords: [
          "football", "basketball", "swimming", "cycling", "running",
          "hobby", "interest", "play", "watch", "listen", "read",
          "draw", "sing", "dance", "game", "team", "player", "match"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0006-0000-0000-000000000006",
        name: "Family & Friends",
        name_vi: "Gia đình & Bạn bè",
        slug: "family-friends",
        icon: "👨‍👩‍👧",
        difficulty_range: "beginner",
        min_age: 8,
        max_age: 18,
        vocabulary_keywords: [
          "family", "mother", "father", "sister", "brother", "grandmother",
          "grandfather", "friend", "best friend", "cousin", "aunt", "uncle",
          "love", "help", "share", "talk", "play together", "birthday"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0007-0000-0000-000000000007",
        name: "Shopping",
        name_vi: "Mua sắm",
        slug: "shopping",
        icon: "🛒",
        difficulty_range: "intermediate",
        min_age: 10,
        max_age: 18,
        vocabulary_keywords: [
          "shop", "store", "buy", "sell", "price", "cheap", "expensive",
          "size", "color", "clothes", "shoes", "gift", "money", "pay",
          "cash", "card", "online", "discount", "sale", "mall"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0008-0000-0000-000000000008",
        name: "Weather & Nature",
        name_vi: "Thời tiết & Thiên nhiên",
        slug: "weather-nature",
        icon: "🌤️",
        difficulty_range: "beginner",
        min_age: 8,
        max_age: 18,
        vocabulary_keywords: [
          "sunny", "rainy", "cloudy", "windy", "snowy", "hot", "cold",
          "spring", "summer", "autumn", "winter", "weather", "forecast",
          "temperature", "rain", "snow", "wind", "sky", "nature"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0009-0000-0000-000000000009",
        name: "Animals",
        name_vi: "Động vật",
        slug: "animals",
        icon: "🐾",
        difficulty_range: "beginner",
        min_age: 8,
        max_age: 14,
        vocabulary_keywords: [
          "dog", "cat", "bird", "fish", "horse", "cow", "pig", "sheep",
          "animal", "pet", "wild", "farm", "zoo", "feed", "run", "fly",
          "swim", "jump", "small", "big", "fur", "wing"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0010-0000-0000-000000000010",
        name: "Movies & Music",
        name_vi: "Phim ảnh & Âm nhạc",
        slug: "movies-music",
        icon: "🎬",
        difficulty_range: "intermediate",
        min_age: 10,
        max_age: 18,
        vocabulary_keywords: [
          "movie", "film", "cinema", "actor", "actress", "music", "song",
          "singer", "band", "concert", "watch", "listen", "favorite",
          "genre", "horror", "comedy", "action", "romance", "instrument"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0011-0000-0000-000000000011",
        name: "Technology",
        name_vi: "Công nghệ",
        slug: "technology",
        icon: "💻",
        difficulty_range: "intermediate",
        min_age: 10,
        max_age: 18,
        vocabulary_keywords: [
          "computer", "phone", "tablet", "internet", "email", "game",
          "app", "screen", "keyboard", "mouse", "camera", "photo",
          "video", "social media", "message", "download", "upload", "wifi"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0012-0000-0000-000000000012",
        name: "Health & Body",
        name_vi: "Sức khỏe & Cơ thể",
        slug: "health-body",
        icon: "🏥",
        difficulty_range: "intermediate",
        min_age: 10,
        max_age: 18,
        vocabulary_keywords: [
          "headache", "stomachache", "fever", "cold", "doctor", "medicine",
          "hospital", "healthy", "exercise", "sleep", "rest", "head",
          "hand", "foot", "eye", "ear", "nose", "mouth", "body"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0013-0000-0000-000000000013",
        name: "Jobs & Future",
        name_vi: "Nghề nghiệp & Tương lai",
        slug: "jobs-future",
        icon: "💼",
        difficulty_range: "advanced",
        min_age: 13,
        max_age: 18,
        vocabulary_keywords: [
          "job", "career", "doctor", "teacher", "engineer", "chef",
          "pilot", "worker", "office", "salary", "work", "earn",
          "future", "dream", "goal", "plan", "interview", "skill"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0014-0000-0000-000000000014",
        name: "Festivals & Culture",
        name_vi: "Lễ hội & Văn hóa",
        slug: "festivals-culture",
        icon: "🎉",
        difficulty_range: "intermediate",
        min_age: 10,
        max_age: 18,
        vocabulary_keywords: [
          "festival", "celebrate", "party", "birthday", "Christmas",
          "Halloween", "New Year", "traditional", "culture", "custom",
          "food", "dance", "music", "costume", "gift", "firework", "holiday"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "a1b2c3d4-0015-0000-0000-000000000015",
        name: "Environment",
        name_vi: "Môi trường",
        slug: "environment",
        icon: "🌍",
        difficulty_range: "advanced",
        min_age: 12,
        max_age: 18,
        vocabulary_keywords: [
          "environment", "pollution", "climate", "recycle", "nature",
          "forest", "ocean", "river", "mountain", "protect", "save",
          "planet", "earth", "energy", "waste", "clean", "green", "global warming"
        ],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const insertFields = [
      "id", "name", "name_vi", "slug", "icon",
      "difficulty_range", "min_age", "max_age",
      "vocabulary_keywords", "is_active",
    ];

    for (const topic of topics) {
      await queryInterface.insert(
        null,
        "placement_topics",
        {
          id: topic.id,
          name: topic.name,
          name_vi: topic.name_vi,
          slug: topic.slug,
          icon: topic.icon,
          difficulty_range: topic.difficulty_range,
          min_age: topic.min_age,
          max_age: topic.max_age,
          vocabulary_keywords: JSON.stringify(topic.vocabulary_keywords),
          is_active: topic.is_active,
        },
        {}
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("placement_topics", null, {});
  },
};
