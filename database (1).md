// =====================================================================
// English Learning Web Game — Sơ đồ CSDL (DBML cho dbdiagram.io)
// ===================================================================== 
// Cập nhật: 2026-06-18 · Version 3.2
// Hệ quản trị: MySQL 5.7+ / utf8mb4.
// Số bảng: 35 bảng có Sequelize model + writing_submissions dạng migration-only.
//
// LƯU Ý:
//   - 35 bảng có model nằm trong backend/src/models và được tạo bởi sequelize.sync().
//   - writing_submissions có trong backend/migrations/database.js để chuẩn bị lưu lịch sử
//     chấm sửa writing/OCR, nhưng CHƯA có Sequelize model và chưa được route hiện tại dùng.
//   - Assistant chat history hiện lưu ở conversations/conversation_messages; proofread/OCR
//     qua /api/proofread hiện trả kết quả trực tiếp, không lưu ảnh/bài chấm vào DB.
//
// Quy ước:
//   - char(36)  = khóa chính/khóa ngoại kiểu UUID (DataTypes.UUID).
//   - int [increment] = khóa chính tự tăng (DataTypes.INTEGER autoIncrement).
//   - datetime  = DataTypes.DATE ; date = DataTypes.DATEONLY.
//   - now()     = giá trị mặc định CURRENT_TIMESTAMP (DataTypes.NOW).
//   - Các bảng nghiệp vụ chính dùng timestamps thủ công (created_at/updated_at
//     là cột DATE tự quản qua hook); các bảng test (placement/checkpoint/
//     challenge) bật timestamps tự động (underscored -> created_at/updated_at).
// =====================================================================

Project english_learning_web_game {
  database_type: 'MySQL'
  Note: 'Web game học tiếng Anh: nội dung học (unit/lesson/vocabulary/grammar/game), người dùng & tiến độ, trò chơi, hội thoại AI, nhiệm vụ, thanh toán, phản hồi & thông báo, mạng xã hội (bạn bè/chat), luyện tập, kiểm tra đầu vào và bài thi checkpoint/challenge.'
}

// =====================================================================
// ENUMS
// =====================================================================

Enum lessons_type {
  "vocabulary"
  "practice"
  "test"
  "grammar"
}

Enum lesson_games_game_type {
  "signal-check"
  "galaxy-match"
  "planetary-order"
  "rescue-mission"
}

Enum lesson_games_difficulty {
  "easy"
  "medium"
  "hard"
}

Enum game_config_game_type {
  "galaxy-match"
  "planetary-order"
  "rescue-mission"
  "signal-check"
  "voice-command"
}

Enum game_config_difficulty {
  "easy"
  "medium"
  "hard"
}

Enum users_subscription {
  "Free"
  "Premium"
  "Super"
}

Enum users_current_level {
  "beginner"
  "intermediate"
  "advanced"
}

Enum users_learning_goal {
  "travel"
  "work"
  "ielts"
  "toeic"
  "daily"
  "academic"
}

Enum users_status {
  "Active"
  "Inactive"
}

Enum users_role {
  "user"
  "admin"
}

Enum user_progress_league {
  "Bronze"
  "Silver"
  "Gold"
  "Diamond"
}

Enum lesson_progress_status {
  "locked"
  "in-progress"
  "completed"
}

Enum game_sessions_status {
  "in-progress"
  "completed"
  "abandoned"
}

Enum conversations_status {
  "active"
  "completed"
  "abandoned"
}

Enum conversation_messages_role {
  "user"
  "assistant"
  "system"
}

Enum missions_type {
  "daily"
  "achievement"
}

Enum user_missions_status {
  "in_progress"
  "completed"
  "claimed"
}

Enum payment_orders_status {
  "pending"
  "approved"
  "rejected"
  "cancelled"
}

Enum feedback_type {
  "Review"
  "Suggestion"
  "Bug Report"
}

Enum feedback_status {
  "unread"
  "read"
  "resolved"
}

Enum notifications_audience_role {
  "user"
  "admin"
}

Enum notification_campaigns_audience {
  "all"
  "free"
  "premium"
  "inactive"
}

Enum notification_campaigns_trigger_type {
  "schedule"
  "level_reached"
  "units_completed"
  "streak"
  "xp_milestone"
  "resume_activity"
}

Enum notification_campaigns_status {
  "draft"
  "scheduled"
  "active"
  "sent"
  "cancelled"
}

Enum friendships_status {
  "pending"
  "accepted"
}

Enum direct_messages_type {
  "text"
  "image"
  "voice"
}

Enum practice_topics_mode {
  "listen-fill"
  "listen-repeat"
  "read-answer"
  "read-story"
}

Enum practice_attempts_mode {
  "listen-fill"
  "listen-repeat"
  "read-answer"
  "read-story"
}

Enum practice_attempts_status {
  "in-progress"
  "completed"
  "abandoned"
}

Enum placement_topics_difficulty_range {
  "beginner"
  "intermediate"
  "advanced"
  "all"
}

Enum placement_level_input {
  "beginner"
  "intermediate"
  "advanced"
}

Enum placement_cefr_level {
  "A1"
  "A2"
  "B1"
  "B2"
  "C1"
}

Enum placement_status {
  "in-progress"
  "completed"
  "abandoned"
}

Enum unit_test_configs_test_type {
  "checkpoint"
  "challenge"
}

Enum unit_test_sessions_test_type {
  "checkpoint"
  "challenge"
}

Enum unit_test_sessions_status {
  "in_progress"
  "completed"
  "abandoned"
}

Enum question_checkpoints_section {
  "A"
  "B"
  "C"
  "D"
  "E"
}

Enum question_checkpoints_question_type {
  "match"
  "listen_write"
  "fill_blank"
  "unscramble"
  "read_speak"
}

Enum question_challenges_section {
  "A"
  "B"
  "C"
  "D"
}

Enum question_challenges_question_type {
  "match"
  "listen_write"
  "fill_blank"
  "word_bank"
  "listen_repeat"
}

Enum writing_submissions_input_type {
  "text"
  "image"
}

Enum writing_submissions_status {
  "processing"
  "completed"
  "failed"
}

// =====================================================================
// 1. NỘI DUNG HỌC
// =====================================================================

Table units {
  id int [pk, increment]
  title varchar(100) [not null]
  subtitle varchar(255)
  icon varchar(10)
  order_index int [not null]
  total_lessons int [default: 15]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Đơn vị học (unit) - cấp tổ chức cao nhất của nội dung.'
}

Table lessons {
  id int [pk, increment]
  unit_id int [not null]
  title varchar(100) [not null]
  type lessons_type [not null]
  order_index int [not null]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Bài học thuộc một unit; phân loại vocabulary/practice/test/grammar.'
}

Table vocabulary {
  id int [pk, increment]
  unit_id int [not null]
  lesson_id int [not null]
  word varchar(100) [not null]
  phonetic varchar(100)
  translation varchar(255) [not null]
  image_url varchar(500)
  audio_url varchar(500)
  level int [default: 1]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Từ vựng của một bài học. image_url/audio_url là nguồn dùng chung cho cả game và practice.'
}

Table grammar {
  id int [pk, increment]
  unit_id int [not null]
  lesson_id int [not null]
  grammar_type varchar(120) [note: 'Loại ngữ pháp - dùng để gom nhóm tab "tổng hợp"']
  name varchar(255) [note: 'Tên điểm ngữ pháp']
  formula varchar(500) [note: 'Công thức, ví dụ: S + V(s/es) + O']
  pattern varchar(255) [not null, note: 'Cột cũ (legacy), bắt buộc; tự suy ra từ formula||name']
  explanation text [note: 'Cách dùng']
  example text [note: 'Ví dụ']
  translation varchar(500)
  order_index int [default: 0]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Điểm ngữ pháp thuộc unit/lesson.'
}

Table lesson_games {
  id int [pk, increment]
  lesson_id int [not null]
  game_type lesson_games_game_type [not null]
  difficulty lesson_games_difficulty [default: "medium"]
  question_count int [default: 10]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Cấu hình game theo bài học (legacy). GameSession hiện dùng game_config thay cho bảng này.'
}

Table game_config {
  id int [pk, increment]
  game_type game_config_game_type [not null, note: '5 loại game']
  unit_id int [note: 'Tùy chọn: unit liên quan']
  lesson_id int [note: 'Tùy chọn: lesson liên quan']
  difficulty game_config_difficulty [default: "medium"]
  questions_count int [default: 10, note: 'Số câu hỏi trong game']
  time_limit int [default: 120, note: 'Giới hạn thời gian (giây), 0 = không giới hạn']
  passing_score int [default: 70, note: 'Điểm tối thiểu để pass (%)']
  xp_reward int [default: 50, note: 'XP thưởng khi hoàn thành']
  content json [note: 'Nội dung game do admin soạn; null = tự sinh từ vocabulary']
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Cấu hình + nội dung của một game (do admin soạn hoặc tự sinh).'
}

// =====================================================================
// 2. NGƯỜI DÙNG & TIẾN ĐỘ
// =====================================================================

Table users {
  id char(36) [pk, note: 'UUIDV4']
  username varchar(50) [not null, unique]
  email varchar(255) [not null, unique, note: 'Có validate isEmail']
  password_hash varchar(255) [not null, note: 'Băm bằng bcrypt (hook beforeCreate)']
  display_name varchar(100)
  avatar varchar(500)
  level int [default: 1]
  subscription users_subscription [default: "Free"]
  premium_expires_at datetime
  subscription_cancelled_at datetime
  native_language varchar(50) [default: 'vi']
  current_level users_current_level [default: "beginner"]
  learning_goal users_learning_goal [default: "daily"]
  daily_goal int [default: 15, note: 'Mục tiêu học mỗi ngày (phút)']
  joined_date datetime [default: `now()`]
  status users_status [default: "Active"]
  last_active datetime
  role users_role [default: "user"]
  reset_token varchar(6) [note: 'Mã đặt lại mật khẩu']
  reset_token_expires datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Bảng người dùng cốt lõi, khóa chính UUID.'
}

Table user_progress {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null, unique]
  total_xp int [default: 0, note: 'XP tích lũy trọn đời']
  weekly_xp int [default: 0, note: 'XP tuần hiện tại']
  xp_this_week int [default: 0, note: 'XP trong tuần dùng cho bảng xếp hạng']
  level int [default: 1, note: 'Tính từ total_xp (floor(total_xp/1000)+1)']
  streak_days int [default: 0, note: 'Số ngày hoạt động liên tiếp']
  last_active_date date [note: 'Ngày hoạt động/đăng nhập gần nhất']
  words_learned int [default: 0, note: 'Tổng số từ đã học']
  total_study_minutes int [default: 0, note: 'Tổng thời gian học (phút)']
  units_completed int [default: 0, note: 'Tổng số unit hoàn thành']
  lessons_completed int [default: 0, note: 'Tổng số lesson hoàn thành']
  league user_progress_league [default: "Bronze", note: 'Hạng đấu (chỉ tăng, hạ bậc qua reset tuần)']
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Thống kê & tiến độ tổng của người dùng (1-1 với users).'
}

Table user_settings {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null, unique]
  push_notifications boolean [not null, default: true]
  email_reminders boolean [not null, default: true]
  sound_effects boolean [not null, default: true]
  background_music boolean [not null, default: true]
  music_volume int [not null, default: 70, note: '0-100']
  audio_volume int [not null, default: 80, note: '0-100']
  dark_mode boolean [not null, default: false]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Cài đặt cá nhân của người dùng (1-1 với users).'
}

Table lesson_progress {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  unit_id int [not null]
  lesson_id int [not null]
  status lesson_progress_status [default: "locked"]
  stars_earned int [default: 0, note: '0-3 sao']
  is_review boolean [default: false]
  xp_earned int [default: 0]
  correct_count int [default: 0]
  total_count int [default: 0]
  completed_at datetime
  first_completed_at datetime
  created_at datetime [default: `now()`]
  Note: 'Tiến độ từng bài học của người dùng. Unique (user_id, lesson_id).'

  Indexes {
    (user_id, lesson_id) [unique]
  }
}

Table user_vocabulary {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  vocab_id int [not null]
  is_favorite boolean [default: false]
  mastery_level int [default: 0, note: '0-5: mức độ thành thạo']
  correct_count int [default: 0]
  incorrect_count int [default: 0]
  last_reviewed datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Tiến độ học từng từ vựng của người dùng. Unique (user_id, vocab_id).'

  Indexes {
    (user_id, vocab_id) [unique]
    is_favorite
  }
}

// =====================================================================
// 3. TRÒ CHƠI
// =====================================================================

Table game_sessions {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  game_config_id int [not null]
  status game_sessions_status [default: "in-progress"]
  score int [default: 0, note: 'Điểm (0-100)']
  correct_answers int [default: 0]
  total_questions int [not null]
  questions_data json [note: 'JSON chứa câu hỏi và đáp án']
  time_spent int [default: 0, note: 'Thời gian chơi (giây)']
  xp_earned int [default: 0]
  started_at datetime [default: `now()`]
  completed_at datetime
  created_at datetime [default: `now()`]
  Note: 'Phiên chơi game của người dùng.'
}

Table game_wrong_answers {
  id char(36) [pk, note: 'UUIDV4']
  game_session_id char(36) [not null]
  question_id varchar(100)
  prompt text [note: 'Câu hỏi']
  user_answer varchar(255) [note: 'Đáp án người dùng chọn']
  correct_answer varchar(255) [not null, note: 'Đáp án đúng']
  created_at datetime [default: `now()`]
  Note: 'Ghi lại các câu trả lời sai trong một phiên game.'
}

// =====================================================================
// 4. HỘI THOẠI AI
// =====================================================================

Table conversations {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  topic varchar(100) [not null, note: 'Chủ đề/nhóm hội thoại']
  topic_title varchar(255) [not null, note: 'Tiêu đề hiển thị']
  status conversations_status [default: "active"]
  total_messages int [default: 0]
  duration_seconds int [default: 0]
  started_at datetime [default: `now()`]
  ended_at datetime
  Note: 'Phiên hội thoại luyện nói với AI.'
}

Table conversation_messages {
  id char(36) [pk, note: 'UUIDV4']
  conversation_id char(36) [not null]
  role conversation_messages_role [not null, note: 'Vai người gửi']
  content text [not null]
  tokens_used int [default: 0]
  created_at datetime [default: `now()`]
  Note: 'Tin nhắn trong một phiên hội thoại AI.'
}

// =====================================================================
// 5. NHIỆM VỤ & THÀNH TÍCH
// =====================================================================

Table missions {
  id char(36) [pk, note: 'UUIDV4']
  type missions_type [not null]
  code varchar(50) [not null, unique, note: 'Mã định danh: login, flashcard, lesson...']
  title varchar(100) [not null]
  description text [not null]
  icon varchar(50) [default: '🌟']
  badge varchar(255)
  medal varchar(50)
  target int [not null, default: 1, note: 'Số lần cần đạt để hoàn thành']
  xp_reward int [not null, default: 10]
  chain_code varchar(50) [note: 'Mã nhiệm vụ trước (cho chuỗi thành tích)']
  order_index int [default: 0]
  is_active boolean [default: true]
  reset_daily boolean [default: false, note: 'Reset lúc nửa đêm']
  start_date datetime
  end_date datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Định nghĩa nhiệm vụ hằng ngày & thành tích.'
}

Table user_missions {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  mission_id char(36) [not null]
  progress int [default: 0, note: 'Tiến độ hiện tại tới target']
  status user_missions_status [default: "in_progress"]
  claimed_at datetime [note: 'Thời điểm nhận thưởng']
  last_updated datetime [default: `now()`]
  reset_date datetime [note: 'Ngày reset nhiệm vụ hằng ngày (DataTypes.DATE -> DATETIME)']
  created_at datetime [default: `now()`]
  Note: 'Tiến độ nhiệm vụ của người dùng. Unique (user_id, mission_id, reset_date).'

  Indexes {
    (user_id, mission_id, reset_date) [unique]
  }
}

// =====================================================================
// 6. THANH TOÁN
// =====================================================================

Table payment_orders {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  amount decimal(10,2) [not null]
  package_type varchar(50) [not null, note: 'VD: Premium-Monthly, Super-Monthly']
  duration_months int
  premium_expires_at datetime
  transfer_type varchar(20) [note: 'qr - SePay luôn trả qr']
  trans_id varchar(100) [note: 'Mã giao dịch từ ngân hàng']
  transfer_amount decimal(10,2)
  transfer_date datetime
  account_number varchar(50) [note: 'Số tài khoản người gửi']
  account_holder varchar(200) [note: 'Tên chủ tài khoản người gửi']
  bank_code varchar(20) [note: 'Mã ngân hàng người gửi']
  description varchar(500) [note: 'Nội dung chuyển khoản']
  status payment_orders_status [default: "pending"]
  admin_note varchar(500)
  reviewed_by char(36) [note: 'Admin đã duyệt đơn']
  reviewed_at datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Đơn thanh toán/nâng cấp gói (tích hợp SePay QR).'
}

// =====================================================================
// 7. PHẢN HỒI & THÔNG BÁO
// =====================================================================

Table feedback {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [note: 'Null nếu ẩn danh']
  type feedback_type [not null]
  rating int [note: '1-5 sao']
  message text [not null]
  status feedback_status [default: "unread"]
  created_at datetime [default: `now()`]
  resolved_at datetime
  Note: 'Phản hồi / báo lỗi từ người dùng.'
}

Table notifications {
  id char(36) [pk, note: 'UUIDV4']
  recipient_user_id char(36) [note: 'Null = thông báo cấp vai trò (vd toàn admin)']
  audience_role notifications_audience_role [not null, default: "user"]
  type varchar(50) [not null, default: 'system', note: 'feedback_submitted, broadcast, level_reached, friend_request, payment...']
  campaign_id char(36) [note: 'Liên kết về campaign để chống trùng']
  title varchar(150) [not null]
  message text [not null]
  metadata json
  is_read boolean [not null, default: false]
  read_at datetime
  created_at datetime [default: `now()`]
  Note: 'Thông báo gửi tới người dùng hoặc admin.'
}

Table notification_campaigns {
  id char(36) [pk, note: 'UUIDV4']
  title varchar(150) [not null]
  message text [not null]
  image_url varchar(500)
  audience notification_campaigns_audience [not null, default: "all"]
  trigger_type notification_campaigns_trigger_type [not null, default: "schedule"]
  trigger_config json
  status notification_campaigns_status [not null, default: "draft"]
  created_by char(36) [note: 'Admin tạo campaign (tham chiếu users.id, không ràng buộc FK trong model)']
  sent_at datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Chiến dịch thông báo broadcast/điều kiện do admin tạo.'
}

Table notification_templates {
  id int [pk, increment]
  event varchar(50) [not null, unique, note: 'rank_up, premium_purchase, friend_request...']
  title varchar(150) [not null]
  body text [not null]
  variables json [note: 'Danh sách placeholder cho phép']
  enabled boolean [not null, default: true]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Mẫu thông báo cá nhân hóa theo sự kiện.'
}

// =====================================================================
// 8. MẠNG XÃ HỘI (BẠN BÈ & CHAT)
// =====================================================================

Table friendships {
  id char(36) [pk, note: 'UUIDV4']
  requester_id char(36) [not null, note: 'Người gửi lời mời']
  addressee_id char(36) [not null, note: 'Người nhận lời mời']
  status friendships_status [default: "pending"]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Quan hệ bạn bè. Unique (requester_id, addressee_id).'

  Indexes {
    (requester_id, addressee_id) [unique]
    addressee_id
  }
}

Table direct_messages {
  id char(36) [pk, note: 'UUIDV4']
  sender_id char(36) [not null]
  receiver_id char(36) [not null]
  type direct_messages_type [default: "text"]
  content text [not null]
  media_url varchar(500)
  voice_duration int
  read_at datetime
  created_at datetime [default: `now()`]
  Note: 'Tin nhắn trực tiếp giữa hai người dùng (text/image/voice).'

  Indexes {
    (sender_id, receiver_id, created_at)
    (receiver_id, read_at)
  }
}

// =====================================================================
// 9. LUYỆN TẬP (PRACTICE)
// =====================================================================

Table practice_topics {
  id char(36) [pk, note: 'UUIDV4']
  mode practice_topics_mode [not null]
  slug varchar(100) [not null]
  title varchar(150) [not null]
  description varchar(500)
  emoji varchar(50)
  color varchar(100)
  image_url varchar(500)
  order_index int [default: 0]
  is_active boolean [default: true]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Chủ đề luyện tập theo từng chế độ. Unique (mode, slug).'

  Indexes {
    (mode, slug) [unique]
  }
}

Table practice_items {
  id char(36) [pk, note: 'UUIDV4']
  topic_id char(36) [not null]
  order_index int [default: 0]
  title varchar(150)
  prompt varchar(500)
  passage text
  image_url varchar(500)
  audio_text text
  translation text
  content_data json
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Một mục luyện tập thuộc chủ đề. Unique (topic_id, order_index).'

  Indexes {
    (topic_id, order_index) [unique]
  }
}

Table practice_attempts {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  topic_id char(36) [not null]
  mode practice_attempts_mode [not null]
  score int [default: 0]
  correct_count int [default: 0]
  total_count int [default: 0]
  time_spent int [default: 0, note: 'Giây']
  xp_earned int [default: 0]
  status practice_attempts_status [default: "in-progress"]
  answers json
  started_at datetime [default: `now()`]
  completed_at datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Một lượt làm luyện tập của người dùng.'
}

Table practice_progress {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  topic_id char(36) [not null]
  completed_items int [default: 0]
  total_items int [default: 0]
  best_score int [default: 0]
  attempts_count int [default: 0]
  last_attempt_at datetime
  completed_at datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Tiến độ luyện tập theo chủ đề. Unique (user_id, topic_id).'

  Indexes {
    (user_id, topic_id) [unique]
  }
}

// =====================================================================
// 10. KIỂM TRA ĐẦU VÀO (PLACEMENT)
// =====================================================================

Table placement_topics {
  id char(36) [pk, note: 'UUIDV4']
  name varchar(100) [not null, note: 'Tên chủ đề (tiếng Anh)']
  name_vi varchar(150) [not null, note: 'Tên chủ đề (tiếng Việt)']
  slug varchar(100) [not null, unique]
  icon varchar(10) [default: '📚']
  difficulty_range placement_topics_difficulty_range [default: "all"]
  min_age int [default: 8]
  max_age int [default: 18]
  unit_id int [note: 'Unit được mở khi thành thạo chủ đề này']
  unit_order int [note: 'Thứ tự hiển thị, khớp thứ tự unit']
  vocabulary_keywords json [note: 'Mảng từ khóa định hướng sinh câu hỏi AI']
  is_active boolean [default: true]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Chủ đề của bài kiểm tra đầu vào, ánh xạ sang unit để mở khóa.'
}

Table placement_test_sessions {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  age int [not null, note: 'Validate 8-18']
  level_input placement_level_input [not null]
  selected_topics json [not null, note: 'Mảng slug chủ đề người dùng chọn']
  questions_data json [not null, note: 'Toàn bộ câu hỏi AI sinh kèm đáp án đúng']
  answers_data json [note: 'Đáp án người dùng']
  score int [note: 'Điểm tổng 0-100']
  section_scores json [note: 'Điểm theo section']
  unlock_progress json [note: 'Kết quả mở khóa chủ đề/unit']
  passed boolean
  cefr_level placement_cefr_level
  status placement_status [default: "in-progress"]
  completed_at datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Phiên làm bài kiểm tra đầu vào (timestamps tự động).'
}

// =====================================================================
// 11. BÀI THI CHECKPOINT & CHALLENGE
// =====================================================================

Table unit_test_configs {
  id varchar(50) [pk, note: 'checkpoint-1, unit-1...']
  test_type unit_test_configs_test_type [not null]
  title varchar(255) [not null]
  description text
  units_covered json [note: 'Mảng unit ID [1,2,3] - cho checkpoint']
  unit_id int [note: 'Unit ID - cho challenge']
  pass_threshold int [default: 80, note: '% để pass (checkpoint 80, challenge 100)']
  total_score int [default: 20, note: 'Tổng điểm (checkpoint 20, challenge 10)']
  is_active boolean [default: true]
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Cấu hình bài thi checkpoint (vượt nhiều unit) hoặc challenge (1 unit).'
}

Table unit_test_sessions {
  id int [pk, increment]
  user_id char(36) [not null]
  test_type unit_test_sessions_test_type [not null]
  test_id varchar(50) [not null, note: 'checkpoint-1, unit-1...']
  units_covered json [note: 'Mảng unit ID - cho checkpoint']
  unit_id int [note: 'Unit ID - cho challenge']
  status unit_test_sessions_status [default: "in_progress"]
  answers_data json [note: 'Đáp án người dùng']
  score int [default: 0, note: 'Tổng điểm']
  pass boolean [default: false]
  section_scores json [note: 'Điểm theo section']
  section_details json [note: 'Chi tiết từng câu']
  time_spent_seconds int [default: 0]
  completed_at datetime
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Phiên làm bài checkpoint/challenge của người dùng.'
}

Table question_checkpoints {
  id int [pk, increment]
  checkpoint_id varchar(50) [not null, note: 'Tham chiếu unit_test_configs.id']
  section question_checkpoints_section [not null, note: 'A:match B:listen_write C:fill_blank D:unscramble E:read_speak']
  question_type question_checkpoints_question_type [not null]
  content json [not null, note: 'Nội dung câu hỏi (không có đáp án)']
  correct_answer json [not null, note: 'Đáp án đúng']
  score int [not null, default: 1]
  display_order int [not null, default: 0]
  is_active boolean [default: true]
  created_at datetime [not null, default: `now()`]
  updated_at datetime [not null, default: `now()`]
  Note: 'Ngân hàng câu hỏi cho bài thi checkpoint.'
}

Table question_challenges {
  id int [pk, increment]
  unit_id int [not null]
  section question_challenges_section [not null, note: 'A:match B:listen_write C:word_bank D:listen_repeat']
  question_type question_challenges_question_type [not null]
  content json [not null, note: 'Nội dung câu hỏi (không có đáp án)']
  correct_answer json [not null, note: 'Đáp án đúng']
  score int [not null, default: 1]
  display_order int [not null, default: 0]
  is_active boolean [default: true]
  created_at datetime [not null, default: `now()`]
  updated_at datetime [not null, default: `now()`]
  Note: 'Ngân hàng câu hỏi cho bài thi challenge của một unit.'
}

// =====================================================================
// 12. HỆ THỐNG
// =====================================================================

Table system_state {
  key varchar(100) [pk, note: 'Khóa định danh marker hệ thống']
  value text
  updated_at datetime [default: `now()`]
  Note: 'Kho key/value cho marker runtime (vd lần reset bảng xếp hạng tuần gần nhất).'
}

// =====================================================================
// 13. CHẤM SỬA BÀI VIẾT (WRITING) — MIGRATION-ONLY / DỰ PHÒNG
// =====================================================================

Table writing_submissions {
  id char(36) [pk, note: 'UUIDV4']
  user_id char(36) [not null]
  input_type writing_submissions_input_type [not null, default: "text", note: 'Cách gửi: gõ text hay tải ảnh']
  image_url varchar(500) [note: 'URL ảnh bài viết (nếu gửi ảnh; lưu trên Cloudinary)']
  original_text text [note: 'Bài viết của user (text gõ vào hoặc văn bản OCR từ ảnh)']
  corrections json [note: 'Mảng lỗi AI phát hiện: [{type, original, suggestion, explanation}]']
  suggested_rewrite text [note: 'Bài viết gợi ý viết lại do AI sinh']
  status writing_submissions_status [not null, default: "processing", note: 'Trạng thái xử lý OCR/AI']
  created_at datetime [default: `now()`]
  updated_at datetime [default: `now()`]
  Note: 'Bài viết user gửi (text/ảnh) + kết quả AI chấm sửa (lỗi chính tả/ngữ pháp + bản viết lại). Hiện chỉ có trong migration tổng hợp, CHƯA có Sequelize model và route proofread/OCR chưa ghi bảng này.'
}

// =====================================================================
// QUAN HỆ (FOREIGN KEYS)
// =====================================================================

// Nội dung học
Ref: lessons.unit_id > units.id [delete: cascade]
Ref: vocabulary.unit_id > units.id [delete: cascade]
Ref: vocabulary.lesson_id > lessons.id [delete: cascade]
Ref: grammar.unit_id > units.id [delete: cascade]
Ref: grammar.lesson_id > lessons.id [delete: cascade]
Ref: lesson_games.lesson_id > lessons.id [delete: cascade]
Ref: game_config.unit_id > units.id [delete: cascade]
Ref: game_config.lesson_id > lessons.id [delete: cascade]

// Người dùng & tiến độ (1-1 với users)
Ref: user_progress.user_id - users.id [delete: cascade]
Ref: user_settings.user_id - users.id [delete: cascade]
Ref: lesson_progress.user_id > users.id [delete: cascade]
Ref: lesson_progress.unit_id > units.id [delete: cascade]
Ref: lesson_progress.lesson_id > lessons.id [delete: cascade]
Ref: user_vocabulary.user_id > users.id [delete: cascade]
Ref: user_vocabulary.vocab_id > vocabulary.id [delete: cascade]

// Trò chơi
Ref: game_sessions.user_id > users.id [delete: cascade]
Ref: game_sessions.game_config_id > game_config.id [delete: cascade]
Ref: game_wrong_answers.game_session_id > game_sessions.id [delete: cascade]

// Hội thoại AI
Ref: conversations.user_id > users.id [delete: cascade]
Ref: conversation_messages.conversation_id > conversations.id [delete: cascade]

// Nhiệm vụ
Ref: user_missions.user_id > users.id [delete: cascade]
Ref: user_missions.mission_id > missions.id [delete: cascade]

// Thanh toán
Ref: payment_orders.user_id > users.id [delete: cascade]
Ref: payment_orders.reviewed_by > users.id [delete: set null]

// Phản hồi & thông báo
Ref: feedback.user_id > users.id [delete: set null]
Ref: notifications.recipient_user_id > users.id [delete: cascade]
Ref: notification_campaigns.created_by > users.id [note: 'Tham chiếu logic; model không khai báo FK']

// Mạng xã hội
Ref: friendships.requester_id > users.id [delete: cascade]
Ref: friendships.addressee_id > users.id [delete: cascade]
Ref: direct_messages.sender_id > users.id [delete: cascade]
Ref: direct_messages.receiver_id > users.id [delete: cascade]

// Luyện tập
Ref: practice_items.topic_id > practice_topics.id [delete: cascade]
Ref: practice_attempts.user_id > users.id [delete: cascade]
Ref: practice_attempts.topic_id > practice_topics.id [delete: cascade]
Ref: practice_progress.user_id > users.id [delete: cascade]
Ref: practice_progress.topic_id > practice_topics.id [delete: cascade]

// Kiểm tra đầu vào
Ref: placement_topics.unit_id > units.id
Ref: placement_test_sessions.user_id > users.id [delete: cascade]

// Checkpoint & Challenge
Ref: unit_test_sessions.user_id > users.id [delete: cascade]
Ref: unit_test_sessions.test_id > unit_test_configs.id
Ref: question_checkpoints.checkpoint_id > unit_test_configs.id [delete: cascade]
Ref: question_challenges.unit_id > units.id [delete: cascade]

// Chấm sửa writing (migration-only)
Ref: writing_submissions.user_id > users.id [delete: cascade]
