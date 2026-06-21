'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // =====================================================================
    // 1. NỘI DUNG HỌC
    // =====================================================================

    await queryInterface.createTable('units', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING(100), allowNull: false },
      subtitle: { type: Sequelize.STRING(255), allowNull: true },
      icon: { type: Sequelize.STRING(10), allowNull: true },
      order_index: { type: Sequelize.INTEGER, allowNull: false },
      total_lessons: { type: Sequelize.INTEGER, defaultValue: 15 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('lessons', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      unit_id: { type: Sequelize.INTEGER, allowNull: false },
      title: { type: Sequelize.STRING(100), allowNull: false },
      type: { type: Sequelize.ENUM('vocabulary', 'practice', 'test', 'grammar'), allowNull: false },
      order_index: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('vocabulary', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      unit_id: { type: Sequelize.INTEGER, allowNull: false },
      lesson_id: { type: Sequelize.INTEGER, allowNull: false },
      word: { type: Sequelize.STRING(100), allowNull: false },
      phonetic: { type: Sequelize.STRING(100), allowNull: true },
      translation: { type: Sequelize.STRING(255), allowNull: false },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      audio_url: { type: Sequelize.STRING(500), allowNull: true },
      level: { type: Sequelize.INTEGER, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('grammar', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      unit_id: { type: Sequelize.INTEGER, allowNull: false },
      lesson_id: { type: Sequelize.INTEGER, allowNull: false },
      grammar_type: { type: Sequelize.STRING(120), allowNull: true },
      name: { type: Sequelize.STRING(255), allowNull: true },
      formula: { type: Sequelize.STRING(500), allowNull: true },
      pattern: { type: Sequelize.STRING(255), allowNull: false },
      explanation: { type: Sequelize.TEXT, allowNull: true },
      example: { type: Sequelize.TEXT, allowNull: true },
      translation: { type: Sequelize.STRING(500), allowNull: true },
      order_index: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('lesson_games', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      lesson_id: { type: Sequelize.INTEGER, allowNull: false },
      game_type: { type: Sequelize.ENUM('signal-check', 'galaxy-match', 'planetary-order', 'rescue-mission'), allowNull: false },
      difficulty: { type: Sequelize.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
      question_count: { type: Sequelize.INTEGER, defaultValue: 10 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('game_config', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      game_type: { type: Sequelize.ENUM('galaxy-match', 'planetary-order', 'rescue-mission', 'signal-check', 'voice-command'), allowNull: false },
      unit_id: { type: Sequelize.INTEGER, allowNull: true },
      lesson_id: { type: Sequelize.INTEGER, allowNull: true },
      difficulty: { type: Sequelize.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
      questions_count: { type: Sequelize.INTEGER, defaultValue: 10 },
      time_limit: { type: Sequelize.INTEGER, defaultValue: 120 },
      passing_score: { type: Sequelize.INTEGER, defaultValue: 70 },
      xp_reward: { type: Sequelize.INTEGER, defaultValue: 50 },
      content: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });
    await queryInterface.addIndex('game_config', ['lesson_id'], {
      name: 'game_config_one_per_lesson',
      unique: true,
    });

    // =====================================================================
    // 2. NGƯỜI DÙNG & TIẾN ĐỘ
    // =====================================================================

    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      email: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      display_name: { type: Sequelize.STRING(100), allowNull: true },
      avatar: { type: Sequelize.STRING(500), allowNull: true },
      level: { type: Sequelize.INTEGER, defaultValue: 1 },
      subscription: { type: Sequelize.ENUM('Free', 'Premium', 'Super'), defaultValue: 'Free' },
      premium_expires_at: { type: Sequelize.DATE, allowNull: true },
      subscription_cancelled_at: { type: Sequelize.DATE, allowNull: true },
      native_language: { type: Sequelize.STRING(50), defaultValue: 'vi' },
      current_level: { type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'), defaultValue: 'beginner' },
      learning_goal: { type: Sequelize.ENUM('travel', 'work', 'ielts', 'toeic', 'daily', 'academic'), defaultValue: 'daily' },
      daily_goal: { type: Sequelize.INTEGER, defaultValue: 15 },
      joined_date: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      status: { type: Sequelize.ENUM('Active', 'Inactive'), defaultValue: 'Active' },
      last_active: { type: Sequelize.DATE, allowNull: true },
      role: { type: Sequelize.ENUM('user', 'admin'), defaultValue: 'user' },
      reset_token: { type: Sequelize.STRING(6), allowNull: true },
      reset_token_expires: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('user_progress', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, unique: true },
      total_xp: { type: Sequelize.INTEGER, defaultValue: 0 },
      weekly_xp: { type: Sequelize.INTEGER, defaultValue: 0 },
      xp_this_week: { type: Sequelize.INTEGER, defaultValue: 0 },
      level: { type: Sequelize.INTEGER, defaultValue: 1 },
      streak_days: { type: Sequelize.INTEGER, defaultValue: 0 },
      last_active_date: { type: Sequelize.DATEONLY, allowNull: true },
      words_learned: { type: Sequelize.INTEGER, defaultValue: 0 },
      total_study_minutes: { type: Sequelize.INTEGER, defaultValue: 0 },
      units_completed: { type: Sequelize.INTEGER, defaultValue: 0 },
      lessons_completed: { type: Sequelize.INTEGER, defaultValue: 0 },
      league: { type: Sequelize.ENUM('Bronze', 'Silver', 'Gold', 'Diamond'), defaultValue: 'Bronze' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('user_settings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false, unique: true },
      push_notifications: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      email_reminders: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sound_effects: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      background_music: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      music_volume: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 70 },
      audio_volume: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 80 },
      dark_mode: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('lesson_progress', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      unit_id: { type: Sequelize.INTEGER, allowNull: false },
      lesson_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('locked', 'in-progress', 'completed'), defaultValue: 'locked' },
      stars_earned: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_review: { type: Sequelize.BOOLEAN, defaultValue: false },
      xp_earned: { type: Sequelize.INTEGER, defaultValue: 0 },
      correct_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      total_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      first_completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('user_vocabulary', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      vocab_id: { type: Sequelize.INTEGER, allowNull: false },
      is_favorite: { type: Sequelize.BOOLEAN, defaultValue: false },
      mastery_level: { type: Sequelize.INTEGER, defaultValue: 0 },
      correct_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      incorrect_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      last_reviewed: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 3. TRÒ CHƠI
    // =====================================================================

    await queryInterface.createTable('game_sessions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      game_config_id: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM('in-progress', 'completed', 'abandoned'), defaultValue: 'in-progress' },
      score: { type: Sequelize.INTEGER, defaultValue: 0 },
      correct_answers: { type: Sequelize.INTEGER, defaultValue: 0 },
      total_questions: { type: Sequelize.INTEGER, allowNull: false },
      questions_data: { type: Sequelize.JSON, allowNull: true },
      time_spent: { type: Sequelize.INTEGER, defaultValue: 0 },
      xp_earned: { type: Sequelize.INTEGER, defaultValue: 0 },
      started_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('game_wrong_answers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      game_session_id: { type: Sequelize.UUID, allowNull: false },
      question_id: { type: Sequelize.STRING(100), allowNull: true },
      prompt: { type: Sequelize.TEXT, allowNull: true },
      user_answer: { type: Sequelize.STRING(255), allowNull: true },
      correct_answer: { type: Sequelize.STRING(255), allowNull: false },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 4. HỘI THOẠI AI
    // =====================================================================

    await queryInterface.createTable('conversations', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      topic: { type: Sequelize.STRING(100), allowNull: false },
      topic_title: { type: Sequelize.STRING(255), allowNull: false },
      status: { type: Sequelize.ENUM('active', 'completed', 'abandoned'), defaultValue: 'active' },
      total_messages: { type: Sequelize.INTEGER, defaultValue: 0 },
      duration_seconds: { type: Sequelize.INTEGER, defaultValue: 0 },
      started_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      ended_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('conversation_messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      conversation_id: { type: Sequelize.UUID, allowNull: false },
      role: { type: Sequelize.ENUM('user', 'assistant', 'system'), allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      tokens_used: { type: Sequelize.INTEGER, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 5. NHIỆM VỤ & THÀNH TÍCH
    // =====================================================================

    await queryInterface.createTable('missions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      type: { type: Sequelize.ENUM('daily', 'achievement'), allowNull: false },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(100), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      icon: { type: Sequelize.STRING(50), defaultValue: '🌟' },
      badge: { type: Sequelize.STRING(255), allowNull: true },
      medal: { type: Sequelize.STRING(50), allowNull: true },
      target: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      xp_reward: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      chain_code: { type: Sequelize.STRING(50), allowNull: true },
      order_index: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      reset_daily: { type: Sequelize.BOOLEAN, defaultValue: false },
      start_date: { type: Sequelize.DATE, allowNull: true },
      end_date: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('user_missions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      mission_id: { type: Sequelize.UUID, allowNull: false },
      progress: { type: Sequelize.INTEGER, defaultValue: 0 },
      status: { type: Sequelize.ENUM('in_progress', 'completed', 'claimed'), defaultValue: 'in_progress' },
      claimed_at: { type: Sequelize.DATE, allowNull: true },
      last_updated: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      reset_date: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 6. THANH TOÁN
    // =====================================================================

    await queryInterface.createTable('payment_orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      package_type: { type: Sequelize.STRING(50), allowNull: false },
      duration_months: { type: Sequelize.INTEGER, allowNull: true },
      premium_expires_at: { type: Sequelize.DATE, allowNull: true },
      transfer_type: { type: Sequelize.STRING(20), allowNull: true },
      trans_id: { type: Sequelize.STRING(100), allowNull: true },
      transfer_amount: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      transfer_date: { type: Sequelize.DATE, allowNull: true },
      account_number: { type: Sequelize.STRING(50), allowNull: true },
      account_holder: { type: Sequelize.STRING(200), allowNull: true },
      bank_code: { type: Sequelize.STRING(20), allowNull: true },
      description: { type: Sequelize.STRING(500), allowNull: true },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected', 'cancelled'), defaultValue: 'pending' },
      admin_note: { type: Sequelize.STRING(500), allowNull: true },
      reviewed_by: { type: Sequelize.UUID, allowNull: true },
      reviewed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 7. PHẢN HỒI & THÔNG BÁO
    // =====================================================================

    await queryInterface.createTable('feedback', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: true },
      type: { type: Sequelize.ENUM('Review', 'Suggestion', 'Bug Report'), allowNull: false },
      rating: { type: Sequelize.INTEGER, allowNull: true },
      message: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.ENUM('unread', 'read', 'resolved'), defaultValue: 'unread' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      resolved_at: { type: Sequelize.DATE, allowNull: true },
    });

    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      recipient_user_id: { type: Sequelize.UUID, allowNull: true },
      audience_role: { type: Sequelize.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
      type: { type: Sequelize.STRING(50), allowNull: false, defaultValue: 'system' },
      campaign_id: { type: Sequelize.UUID, allowNull: true },
      title: { type: Sequelize.STRING(150), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      metadata: { type: Sequelize.JSON, allowNull: true },
      is_read: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('notification_campaigns', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      title: { type: Sequelize.STRING(150), allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      audience: { type: Sequelize.ENUM('all', 'free', 'premium', 'inactive'), allowNull: false, defaultValue: 'all' },
      trigger_type: { type: Sequelize.ENUM('schedule', 'level_reached', 'units_completed', 'streak', 'xp_milestone', 'resume_activity'), allowNull: false, defaultValue: 'schedule' },
      trigger_config: { type: Sequelize.JSON, allowNull: true },
      status: { type: Sequelize.ENUM('draft', 'scheduled', 'active', 'sent', 'cancelled'), allowNull: false, defaultValue: 'draft' },
      created_by: { type: Sequelize.UUID, allowNull: true },
      sent_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('notification_templates', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      event: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      title: { type: Sequelize.STRING(150), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      variables: { type: Sequelize.JSON, allowNull: true },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 8. MẠNG XÃ HỘI
    // =====================================================================

    await queryInterface.createTable('friendships', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      requester_id: { type: Sequelize.UUID, allowNull: false },
      addressee_id: { type: Sequelize.UUID, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'accepted'), defaultValue: 'pending' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('direct_messages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      sender_id: { type: Sequelize.UUID, allowNull: false },
      receiver_id: { type: Sequelize.UUID, allowNull: false },
      type: { type: Sequelize.ENUM('text', 'image', 'voice'), defaultValue: 'text' },
      content: { type: Sequelize.TEXT, allowNull: false },
      media_url: { type: Sequelize.STRING(500), allowNull: true },
      voice_duration: { type: Sequelize.INTEGER, allowNull: true },
      read_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 9. LUYỆN TẬP (PRACTICE)
    // =====================================================================

    await queryInterface.createTable('practice_topics', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      mode: { type: Sequelize.ENUM('listen-fill', 'listen-repeat', 'read-answer', 'read-story'), allowNull: false },
      slug: { type: Sequelize.STRING(100), allowNull: false },
      title: { type: Sequelize.STRING(150), allowNull: false },
      description: { type: Sequelize.STRING(500), allowNull: true },
      emoji: { type: Sequelize.STRING(50), allowNull: true },
      color: { type: Sequelize.STRING(100), allowNull: true },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      order_index: { type: Sequelize.INTEGER, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('practice_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      topic_id: { type: Sequelize.UUID, allowNull: false },
      order_index: { type: Sequelize.INTEGER, defaultValue: 0 },
      title: { type: Sequelize.STRING(150), allowNull: true },
      prompt: { type: Sequelize.STRING(500), allowNull: true },
      passage: { type: Sequelize.TEXT, allowNull: true },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      audio_text: { type: Sequelize.TEXT, allowNull: true },
      translation: { type: Sequelize.TEXT, allowNull: true },
      content_data: { type: Sequelize.JSON, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('practice_attempts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      topic_id: { type: Sequelize.UUID, allowNull: false },
      mode: { type: Sequelize.ENUM('listen-fill', 'listen-repeat', 'read-answer', 'read-story'), allowNull: false },
      score: { type: Sequelize.INTEGER, defaultValue: 0 },
      correct_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      total_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      time_spent: { type: Sequelize.INTEGER, defaultValue: 0 },
      xp_earned: { type: Sequelize.INTEGER, defaultValue: 0 },
      status: { type: Sequelize.ENUM('in-progress', 'completed', 'abandoned'), defaultValue: 'in-progress' },
      answers: { type: Sequelize.JSON, allowNull: true },
      started_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('practice_progress', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      topic_id: { type: Sequelize.UUID, allowNull: false },
      completed_items: { type: Sequelize.INTEGER, defaultValue: 0 },
      total_items: { type: Sequelize.INTEGER, defaultValue: 0 },
      best_score: { type: Sequelize.INTEGER, defaultValue: 0 },
      attempts_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      last_attempt_at: { type: Sequelize.DATE, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 10. KIỂM TRA ĐẦU VÀO (PLACEMENT)
    // =====================================================================

    await queryInterface.createTable('placement_topics', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      name_vi: { type: Sequelize.STRING(150), allowNull: false },
      slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      icon: { type: Sequelize.STRING(10), defaultValue: '📚' },
      difficulty_range: { type: Sequelize.ENUM('beginner', 'intermediate', 'advanced', 'all'), defaultValue: 'all' },
      min_age: { type: Sequelize.INTEGER, defaultValue: 8 },
      max_age: { type: Sequelize.INTEGER, defaultValue: 18 },
      unit_id: { type: Sequelize.INTEGER, allowNull: true },
      unit_order: { type: Sequelize.INTEGER, allowNull: true },
      vocabulary_keywords: { type: Sequelize.JSON, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('placement_test_sessions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      age: { type: Sequelize.INTEGER, allowNull: false },
      level_input: { type: Sequelize.ENUM('beginner', 'intermediate', 'advanced'), allowNull: false },
      selected_topics: { type: Sequelize.JSON, allowNull: false },
      questions_data: { type: Sequelize.JSON, allowNull: false },
      answers_data: { type: Sequelize.JSON, allowNull: true },
      score: { type: Sequelize.INTEGER, allowNull: true },
      section_scores: { type: Sequelize.JSON, allowNull: true },
      unlock_progress: { type: Sequelize.JSON, allowNull: true },
      passed: { type: Sequelize.BOOLEAN, allowNull: true },
      cefr_level: { type: Sequelize.ENUM('A1', 'A2', 'B1', 'B2', 'C1'), allowNull: true },
      status: { type: Sequelize.ENUM('in-progress', 'completed', 'abandoned'), defaultValue: 'in-progress' },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 11. BÀI THI CHECKPOINT & CHALLENGE
    // =====================================================================

    await queryInterface.createTable('unit_test_configs', {
      id: { type: Sequelize.STRING(50), primaryKey: true },
      test_type: { type: Sequelize.ENUM('checkpoint', 'challenge'), allowNull: false },
      title: { type: Sequelize.STRING(255), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      units_covered: { type: Sequelize.JSON, allowNull: true },
      unit_id: { type: Sequelize.INTEGER, allowNull: true },
      pass_threshold: { type: Sequelize.INTEGER, defaultValue: 80 },
      total_score: { type: Sequelize.INTEGER, defaultValue: 20 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('unit_test_sessions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      test_type: { type: Sequelize.ENUM('checkpoint', 'challenge'), allowNull: false },
      test_id: { type: Sequelize.STRING(50), allowNull: false },
      units_covered: { type: Sequelize.JSON, allowNull: true },
      unit_id: { type: Sequelize.INTEGER, allowNull: true },
      status: { type: Sequelize.ENUM('in_progress', 'completed', 'abandoned'), defaultValue: 'in_progress' },
      answers_data: { type: Sequelize.JSON, allowNull: true },
      score: { type: Sequelize.INTEGER, defaultValue: 0 },
      pass: { type: Sequelize.BOOLEAN, defaultValue: false },
      section_scores: { type: Sequelize.JSON, allowNull: true },
      section_details: { type: Sequelize.JSON, allowNull: true },
      time_spent_seconds: { type: Sequelize.INTEGER, defaultValue: 0 },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('question_checkpoints', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      checkpoint_id: { type: Sequelize.STRING(50), allowNull: false },
      section: { type: Sequelize.ENUM('A', 'B', 'C', 'D', 'E'), allowNull: false },
      question_type: { type: Sequelize.ENUM('match', 'listen_write', 'fill_blank', 'unscramble', 'read_speak'), allowNull: false },
      content: { type: Sequelize.JSON, allowNull: false },
      correct_answer: { type: Sequelize.JSON, allowNull: false },
      score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('question_challenges', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      unit_id: { type: Sequelize.INTEGER, allowNull: false },
      section: { type: Sequelize.ENUM('A', 'B', 'C', 'D'), allowNull: false },
      question_type: { type: Sequelize.ENUM('match', 'listen_write', 'fill_blank', 'word_bank', 'listen_repeat'), allowNull: false },
      content: { type: Sequelize.JSON, allowNull: false },
      correct_answer: { type: Sequelize.JSON, allowNull: false },
      score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 12. HỆ THỐNG
    // =====================================================================

    await queryInterface.createTable('system_state', {
      key: { type: Sequelize.STRING(100), primaryKey: true },
      value: { type: Sequelize.TEXT, allowNull: true },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // 13. CHẤM SỬA BÀI VIẾT (WRITING)
    // =====================================================================

    await queryInterface.createTable('writing_submissions', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: { type: Sequelize.UUID, allowNull: false },
      input_type: { type: Sequelize.ENUM('text', 'image'), allowNull: false, defaultValue: 'text' },
      image_url: { type: Sequelize.STRING(500), allowNull: true },
      original_text: { type: Sequelize.TEXT, allowNull: true },
      corrections: { type: Sequelize.JSON, allowNull: true },
      suggested_rewrite: { type: Sequelize.TEXT, allowNull: true },
      status: { type: Sequelize.ENUM('processing', 'completed', 'failed'), allowNull: false, defaultValue: 'processing' },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
    });

    // =====================================================================
    // SEED DATA
    // =====================================================================

    await queryInterface.bulkInsert('notification_templates', [
      { event: 'top_3_rank', title: 'Congratulations!', body: 'Hey [username], you reached Top 3 on the leaderboard this week!', variables: JSON.stringify(['username']), enabled: true, created_at: new Date(), updated_at: new Date() },
      { event: 'rank_up', title: 'Rank Up!', body: '[username] has leveled up to [new_rank]! Keep going!', variables: JSON.stringify(['username', 'new_rank']), enabled: true, created_at: new Date(), updated_at: new Date() },
      { event: 'rank_down', title: 'Keep Practising', body: 'Your rank dropped to [new_rank]. Don\'t give up, [username]!', variables: JSON.stringify(['username', 'new_rank']), enabled: true, created_at: new Date(), updated_at: new Date() },
      { event: 'premium_purchase', title: 'Welcome to Premium!', body: 'Hi [username], your Premium subscription is now active. Enjoy all features!', variables: JSON.stringify(['username']), enabled: true, created_at: new Date(), updated_at: new Date() },
      { event: 'friend_request', title: 'New Friend Request', body: '[sender] wants to be your friend!', variables: JSON.stringify(['sender']), enabled: true, created_at: new Date(), updated_at: new Date() },
      { event: 'achievement', title: 'Achievement Unlocked!', body: 'You earned the \'[achievement_name]\' badge, [username]!', variables: JSON.stringify(['username', 'achievement_name']), enabled: true, created_at: new Date(), updated_at: new Date() },
      { event: 'feedback_received', title: 'Feedback Received', body: 'Thanks [username], your feedback has been submitted successfully.', variables: JSON.stringify(['username']), enabled: true, created_at: new Date(), updated_at: new Date() },
    ]);

    await queryInterface.bulkInsert('missions', [
      { id: '11111111-1111-1111-1111-111111111111', type: 'daily', code: 'login', title: 'Daily Login', description: 'Log in to the app', icon: '🎯', target: 1, xp_reward: 5, is_active: true, reset_daily: true, created_at: new Date(), updated_at: new Date() },
      { id: '22222222-2222-2222-2222-222222222222', type: 'daily', code: 'flashcard', title: 'Flashcard Practice', description: 'Review 10 flashcards', icon: '📚', target: 10, xp_reward: 15, is_active: true, reset_daily: true, created_at: new Date(), updated_at: new Date() },
      { id: '33333333-3333-3333-3333-333333333333', type: 'daily', code: 'vocabulary', title: 'Learn New Words', description: 'Learn 5 new vocabulary words', icon: '📝', target: 5, xp_reward: 20, is_active: true, reset_daily: true, created_at: new Date(), updated_at: new Date() },
      { id: '44444444-4444-4444-4444-444444444444', type: 'daily', code: 'lesson', title: 'Complete a Lesson', description: 'Complete any lesson', icon: '📖', target: 1, xp_reward: 25, is_active: true, reset_daily: true, created_at: new Date(), updated_at: new Date() },
      { id: '55555555-5555-5555-5555-555555555555', type: 'daily', code: 'game', title: 'Play a Game', description: 'Play any game session', icon: '🎮', target: 1, xp_reward: 20, is_active: true, reset_daily: true, created_at: new Date(), updated_at: new Date() },
      { id: '66666666-6666-6666-6666-666666666666', type: 'daily', code: 'conversation', title: 'AI Conversation', description: 'Have a conversation with AI', icon: '💬', target: 1, xp_reward: 15, is_active: true, reset_daily: true, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777771', type: 'achievement', code: 'first_login', title: 'Welcome Aboard!', description: 'Complete your first login', icon: '👋', target: 1, xp_reward: 10, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777772', type: 'achievement', code: 'first_lesson', title: 'First Steps', description: 'Complete your first lesson', icon: '🌟', target: 1, xp_reward: 50, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777773', type: 'achievement', code: 'first_game', title: 'Game Starter', description: 'Play your first game', icon: '🎯', target: 1, xp_reward: 30, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777774', type: 'achievement', code: 'first_conversation', title: 'Chatty Cathy', description: 'Have your first AI conversation', icon: '💬', target: 1, xp_reward: 30, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777775', type: 'achievement', code: 'vocab_10', title: 'Word Collector', description: 'Learn 10 vocabulary words', icon: '📚', target: 10, xp_reward: 100, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777776', type: 'achievement', code: 'vocab_50', title: 'Vocabulary Enthusiast', description: 'Learn 50 vocabulary words', icon: '📖', target: 50, xp_reward: 250, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777777', type: 'achievement', code: 'streak_7', title: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', target: 7, xp_reward: 200, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777778', type: 'achievement', code: 'streak_30', title: 'Month Master', description: 'Maintain a 30-day streak', icon: '👑', target: 30, xp_reward: 1000, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-777777777779', type: 'achievement', code: 'level_5', title: 'Rising Star', description: 'Reach level 5', icon: '⭐', target: 5, xp_reward: 300, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-77777777777a', type: 'achievement', code: 'level_10', title: 'Dedicated Learner', description: 'Reach level 10', icon: '💎', target: 10, xp_reward: 500, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-77777777777b', type: 'achievement', code: 'unit_complete_1', title: 'Unit Champion', description: 'Complete Unit 1', icon: '🏆', target: 1, xp_reward: 150, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
      { id: '77777777-7777-7777-7777-77777777777c', type: 'achievement', code: 'game_win_10', title: 'Game Champion', description: 'Win 10 games', icon: '🎮', target: 10, xp_reward: 200, is_active: true, reset_daily: false, created_at: new Date(), updated_at: new Date() },
    ]);

    await queryInterface.bulkInsert('practice_topics', [
      { id: 'a1111111-1111-1111-1111-111111111111', mode: 'listen-fill', slug: 'basic-greetings', title: 'Basic Greetings', description: 'Practice common greetings and responses', emoji: '👋', color: '#4CAF50', order_index: 1, is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 'a2222222-2222-2222-2222-222222222222', mode: 'listen-fill', slug: 'numbers', title: 'Numbers', description: 'Learn to recognize and write numbers', emoji: '🔢', color: '#2196F3', order_index: 2, is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 'a3333333-3333-3333-3333-333333333333', mode: 'listen-fill', slug: 'colors', title: 'Colors', description: 'Practice color names', emoji: '🎨', color: '#9C27B0', order_index: 3, is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 'a4444444-4444-4444-4444-444444444444', mode: 'listen-repeat', slug: 'pronunciation-basics', title: 'Pronunciation Basics', description: 'Practice basic pronunciation', emoji: '🗣️', color: '#FF9800', order_index: 4, is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 'a5555555-5555-5555-5555-555555555555', mode: 'read-answer', slug: 'basic-grammar', title: 'Basic Grammar', description: 'Practice simple grammar structures', emoji: '📝', color: '#E91E63', order_index: 5, is_active: true, created_at: new Date(), updated_at: new Date() },
      { id: 'a6666666-6666-6666-6666-666666666666', mode: 'read-story', slug: 'short-stories', title: 'Short Stories', description: 'Read and understand short stories', emoji: '📚', color: '#607D8B', order_index: 6, is_active: true, created_at: new Date(), updated_at: new Date() },
    ]);

    await queryInterface.bulkInsert('system_state', [
      { key: 'last_weekly_reset', value: null, updated_at: new Date() },
      { key: 'last_daily_reset', value: null, updated_at: new Date() },
      { key: 'leaderboard_week', value: '0', updated_at: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('writing_submissions');
    await queryInterface.dropTable('system_state');
    await queryInterface.dropTable('question_challenges');
    await queryInterface.dropTable('question_checkpoints');
    await queryInterface.dropTable('unit_test_sessions');
    await queryInterface.dropTable('unit_test_configs');
    await queryInterface.dropTable('placement_test_sessions');
    await queryInterface.dropTable('placement_topics');
    await queryInterface.dropTable('practice_progress');
    await queryInterface.dropTable('practice_attempts');
    await queryInterface.dropTable('practice_items');
    await queryInterface.dropTable('practice_topics');
    await queryInterface.dropTable('direct_messages');
    await queryInterface.dropTable('friendships');
    await queryInterface.dropTable('notification_templates');
    await queryInterface.dropTable('notification_campaigns');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('feedback');
    await queryInterface.dropTable('payment_orders');
    await queryInterface.dropTable('user_missions');
    await queryInterface.dropTable('missions');
    await queryInterface.dropTable('conversation_messages');
    await queryInterface.dropTable('conversations');
    await queryInterface.dropTable('game_wrong_answers');
    await queryInterface.dropTable('game_sessions');
    await queryInterface.dropTable('user_vocabulary');
    await queryInterface.dropTable('lesson_progress');
    await queryInterface.dropTable('user_settings');
    await queryInterface.dropTable('user_progress');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('game_config');
    await queryInterface.dropTable('lesson_games');
    await queryInterface.dropTable('grammar');
    await queryInterface.dropTable('vocabulary');
    await queryInterface.dropTable('lessons');
    await queryInterface.dropTable('units');
  },
};
