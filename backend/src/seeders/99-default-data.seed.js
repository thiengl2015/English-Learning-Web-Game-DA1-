'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // =====================================================================
    // 1. NOTIFICATION TEMPLATES
    // =====================================================================
    await queryInterface.bulkInsert('notification_templates', [
      { event: 'top_3_rank', title: 'Congratulations!', body: 'Hey [username], you reached Top 3 on the leaderboard this week!', variables: JSON.stringify(['username']), enabled: true, created_at: now, updated_at: now },
      { event: 'rank_up', title: 'Rank Up!', body: '[username] has leveled up to [new_rank]! Keep going!', variables: JSON.stringify(['username', 'new_rank']), enabled: true, created_at: now, updated_at: now },
      { event: 'rank_down', title: 'Keep Practising', body: 'Your rank dropped to [new_rank]. Don\'t give up, [username]!', variables: JSON.stringify(['username', 'new_rank']), enabled: true, created_at: now, updated_at: now },
      { event: 'premium_purchase', title: 'Welcome to Premium!', body: 'Hi [username], your Premium subscription is now active. Enjoy all features!', variables: JSON.stringify(['username']), enabled: true, created_at: now, updated_at: now },
      { event: 'friend_request', title: 'New Friend Request', body: '[sender] wants to be your friend!', variables: JSON.stringify(['sender']), enabled: true, created_at: now, updated_at: now },
      { event: 'achievement', title: 'Achievement Unlocked!', body: 'You earned the \'[achievement_name]\' badge, [username]!', variables: JSON.stringify(['username', 'achievement_name']), enabled: true, created_at: now, updated_at: now },
      { event: 'feedback_received', title: 'Feedback Received', body: 'Thanks [username], your feedback has been submitted successfully.', variables: JSON.stringify(['username']), enabled: true, created_at: now, updated_at: now },
    ]);

    // =====================================================================
    // 2. MISSIONS (Daily & Achievement)
    // =====================================================================
    await queryInterface.bulkInsert('missions', [
      // Daily missions
      { id: '11111111-1111-1111-1111-111111111111', type: 'daily', code: 'login', title: 'Daily Login', description: 'Log in to the app', icon: '🎯', target: 1, xp_reward: 5, is_active: true, reset_daily: true, created_at: now, updated_at: now },
      { id: '22222222-2222-2222-2222-222222222222', type: 'daily', code: 'flashcard', title: 'Flashcard Practice', description: 'Review 10 flashcards', icon: '📚', target: 10, xp_reward: 15, is_active: true, reset_daily: true, created_at: now, updated_at: now },
      { id: '33333333-3333-3333-3333-333333333333', type: 'daily', code: 'vocabulary', title: 'Learn New Words', description: 'Learn 5 new vocabulary words', icon: '📝', target: 5, xp_reward: 20, is_active: true, reset_daily: true, created_at: now, updated_at: now },
      { id: '44444444-4444-4444-4444-444444444444', type: 'daily', code: 'lesson', title: 'Complete a Lesson', description: 'Complete any lesson', icon: '📖', target: 1, xp_reward: 25, is_active: true, reset_daily: true, created_at: now, updated_at: now },
      { id: '55555555-5555-5555-5555-555555555555', type: 'daily', code: 'game', title: 'Play a Game', description: 'Play any game session', icon: '🎮', target: 1, xp_reward: 20, is_active: true, reset_daily: true, created_at: now, updated_at: now },
      { id: '66666666-6666-6666-6666-666666666666', type: 'daily', code: 'conversation', title: 'AI Conversation', description: 'Have a conversation with AI', icon: '💬', target: 1, xp_reward: 15, is_active: true, reset_daily: true, created_at: now, updated_at: now },
      // Achievement missions
      { id: '77777777-7777-7777-7777-777777777771', type: 'achievement', code: 'first_login', title: 'Welcome Aboard!', description: 'Complete your first login', icon: '👋', target: 1, xp_reward: 10, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-777777777772', type: 'achievement', code: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: '🌟', target: 1, xp_reward: 50, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-777777777773', type: 'achievement', code: 'first_game', title: 'Game Starter', description: 'Play your first game', icon: '🎯', target: 1, xp_reward: 30, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-777777777774', type: 'achievement', code: 'first_conversation', title: 'Chatty Cathy', description: 'Have your first AI conversation', icon: '💬', target: 1, xp_reward: 30, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-777777777775', type: 'achievement', code: 'vocab_10', title: 'Word Collector', description: 'Learn 10 vocabulary words', icon: '📚', target: 10, xp_reward: 100, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-777777777776', type: 'achievement', code: 'vocab_50', title: 'Vocabulary Enthusiast', description: 'Learn 50 vocabulary words', icon: '📖', target: 50, xp_reward: 250, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-777777777777', type: 'achievement', code: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', target: 7, xp_reward: 200, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-777777777778', type: 'achievement', code: 'streak_30', title: 'Month Master', description: 'Maintain a 30-day streak', icon: '👑', target: 30, xp_reward: 1000, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-777777777779', type: 'achievement', code: 'level_5', title: 'Rising Star', description: 'Reach level 5', icon: '⭐', target: 5, xp_reward: 300, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-77777777777a', type: 'achievement', code: 'level_10', title: 'Dedicated Learner', description: 'Reach level 10', icon: '💎', target: 10, xp_reward: 500, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-77777777777b', type: 'achievement', code: 'unit_complete_1', title: 'Unit Champion', description: 'Complete Unit 1', icon: '🏆', target: 1, xp_reward: 150, is_active: true, created_at: now, updated_at: now },
      { id: '77777777-7777-7777-7777-77777777777c', type: 'achievement', code: 'game_win_10', title: 'Game Champion', description: 'Win 10 games', icon: '🎮', target: 10, xp_reward: 200, is_active: true, created_at: now, updated_at: now },
    ]);

    // =====================================================================
    // 3. PRACTICE TOPICS
    // =====================================================================
    await queryInterface.bulkInsert('practice_topics', [
      { id: 'a1111111-1111-1111-1111-111111111111', mode: 'listen-fill', slug: 'basic-greetings', title: 'Basic Greetings', description: 'Practice common greetings and responses', emoji: '👋', color: '#4CAF50', order_index: 1, is_active: true, created_at: now, updated_at: now },
      { id: 'a2222222-2222-2222-2222-222222222222', mode: 'listen-fill', slug: 'numbers', title: 'Numbers', description: 'Learn to recognize and write numbers', emoji: '🔢', color: '#2196F3', order_index: 2, is_active: true, created_at: now, updated_at: now },
      { id: 'a3333333-3333-3333-3333-333333333333', mode: 'listen-fill', slug: 'colors', title: 'Colors', description: 'Practice color names', emoji: '🎨', color: '#9C27B0', order_index: 3, is_active: true, created_at: now, updated_at: now },
      { id: 'a4444444-4444-4444-4444-444444444444', mode: 'listen-repeat', slug: 'pronunciation-basics', title: 'Pronunciation Basics', description: 'Practice basic pronunciation', emoji: '🗣️', color: '#FF9800', order_index: 4, is_active: true, created_at: now, updated_at: now },
      { id: 'a5555555-5555-5555-5555-555555555555', mode: 'read-answer', slug: 'basic-grammar', title: 'Basic Grammar', description: 'Practice simple grammar structures', emoji: '📝', color: '#E91E63', order_index: 5, is_active: true, created_at: now, updated_at: now },
      { id: 'a6666666-6666-6666-6666-666666666666', mode: 'read-story', slug: 'short-stories', title: 'Short Stories', description: 'Read and understand short stories', emoji: '📚', color: '#607D8B', order_index: 6, is_active: true, created_at: now, updated_at: now },
    ]);

    // =====================================================================
    // 4. SYSTEM STATE
    // =====================================================================
    await queryInterface.bulkInsert('system_state', [
      { key: 'last_weekly_reset', value: null, updated_at: now },
      { key: 'last_daily_reset', value: null, updated_at: now },
      { key: 'leaderboard_week', value: '0', updated_at: now },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('notification_templates', null, {});
    await queryInterface.bulkDelete('missions', null, {});
    await queryInterface.bulkDelete('practice_topics', null, {});
    await queryInterface.bulkDelete('system_state', null, {});
  },
};
