# Database Schema & ERD — English Learning Web Game

Cập nhật: 2026-06-13 · Version 3.1

Tài liệu đặc tả toàn bộ cơ sở dữ liệu và sơ đồ quan hệ thực tế của hệ thống.

- **Nguồn**: sinh từ các Sequelize model trong [backend/src/models/](backend/src/models/) — đây là schema thực tế lúc chạy do `sequelize.sync()` tạo ra (đối chiếu thêm [backend/migrations/](backend/migrations/)).
- **Hệ quản trị**: MySQL 5.7+ , charset `utf8mb4` / collation `utf8mb4_unicode_ci`.
- **Số bảng**: 36 (35 bảng hiện có + `writing_submissions` mới cho tính năng chấm sửa writing).
- **Sơ đồ trực quan**: mã DBML để dựng ERD trên dbdiagram.io nằm ở [database.md](database.md) (dán nguyên file vào https://dbdiagram.io).

> Ghi chú: bản v2.0 trước đây mô tả các bảng thiết kế dự kiến (achievements, daily_tasks, leaderboard, leagues, subscriptions, transactions, checkpoint_skips...) **không tồn tại** trong mã nguồn hiện tại. Bản v3.x phản ánh đúng 35 bảng đang chạy; **v3.1** bổ sung `writing_submissions` cho tính năng chấm sửa writing (**chưa có trong Sequelize models** — là thiết kế cho tính năng đang phát triển).

---

## 📊 Sơ đồ quan hệ tổng quan (ERD)

```
                         ┌───────────────────────────┐
                         │           USERS           │  (PK: UUID — bảng trung tâm)
                         └───────────────────────────┘
   1:1 ├── user_progress                 (thống kê & XP & hạng đấu)
   1:1 ├── user_settings                 (cài đặt cá nhân)
   1:N ├── lesson_progress      ──FK──▶ units, lessons
   1:N ├── user_vocabulary      ──FK──▶ vocabulary
   1:N ├── game_sessions        ──FK──▶ game_config ──1:N──▶ game_wrong_answers
   1:N ├── conversations        ──1:N──▶ conversation_messages
   1:N ├── user_missions        ──FK──▶ missions
   1:N ├── payment_orders       (reviewed_by ──FK──▶ users)
   1:N ├── feedback
   1:N ├── notifications
   1:N ├── friendships          (requester_id / addressee_id ──FK──▶ users)
   1:N ├── direct_messages      (sender_id / receiver_id ──FK──▶ users)
   1:N ├── practice_attempts    ──FK──▶ practice_topics
   1:N ├── practice_progress    ──FK──▶ practice_topics
   1:N ├── placement_test_sessions
   1:N ├── unit_test_sessions   ──FK──▶ unit_test_configs
   1:N └── writing_submissions  (bài viết text/ảnh + kết quả AI chấm sửa)  ★ MỚI

  NỘI DUNG HỌC
     units ──1:N──▶ lessons ──1:N──▶ vocabulary
                                 └──▶ grammar
                                 └──▶ lesson_games
                                 └──▶ game_config
     units ──1:N──▶ placement_topics
     units ──1:N──▶ question_challenges
     practice_topics ──1:N──▶ practice_items

  BÀI THI
     unit_test_configs ──1:N──▶ question_checkpoints
     unit_test_configs ──1:N──▶ unit_test_sessions

  ĐỘC LẬP
     notification_campaigns · notification_templates · system_state
```

---

## Quy ước chung

- **Khóa chính UUID** (`CHAR(36)`, mặc định `UUIDV4`): các bảng nghiệp vụ trung tâm và bảng theo người dùng (`users`, `user_progress`, `lesson_progress`, `game_sessions`, ...).
- **Khóa chính tự tăng** (`INT AUTO_INCREMENT`): các bảng nội dung tĩnh do admin quản lý (`units`, `lessons`, `vocabulary`, `grammar`, `game_config`, `question_*`, ...).
- **Khóa chính chuỗi**: `unit_test_configs.id` (vd `checkpoint-1`, `unit-1`) và `system_state.key`.
- **Mốc thời gian**: phần lớn bảng đặt `timestamps: false` và tự quản `created_at` / `updated_at` (kiểu `DATETIME`, mặc định `CURRENT_TIMESTAMP`, cập nhật qua hook `beforeUpdate`). Nhóm bảng thi (`placement_test_sessions`, `unit_test_configs`, `unit_test_sessions`, `question_checkpoints`, `question_challenges`) bật timestamps tự động (ánh xạ `created_at` / `updated_at`).
- **`DATE`** trong Sequelize = `DATETIME`; **`DATEONLY`** = `DATE` (chỉ ngày).
- **`JSON`**: lưu dữ liệu có cấu trúc (câu hỏi, đáp án, cấu hình...).
- **Xóa dây chuyền**: hầu hết khóa ngoại dùng `ON DELETE CASCADE`; một số dùng `SET NULL` (xem mục Quan hệ ở cuối).

---

## Nhóm 1 — Nội dung học

### `units` — Đơn vị học
Cấp tổ chức cao nhất của nội dung học.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã unit |
| title | VARCHAR(100) | NOT NULL | Tiêu đề unit |
| subtitle | VARCHAR(255) | NULL | Phụ đề |
| icon | VARCHAR(10) | NULL | Biểu tượng (emoji) |
| order_index | INT | NOT NULL | Thứ tự hiển thị |
| total_lessons | INT | default 15 | Tổng số bài học dự kiến |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `lessons` — Bài học
Bài học thuộc một unit.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã bài học |
| unit_id | INT | NOT NULL, FK → units.id | Unit chứa bài học |
| title | VARCHAR(100) | NOT NULL | Tiêu đề |
| type | ENUM(`vocabulary`,`practice`,`test`,`grammar`) | NOT NULL | Loại bài học |
| order_index | INT | NOT NULL | Thứ tự trong unit |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `vocabulary` — Từ vựng
Từ vựng của một bài học. `image_url` / `audio_url` là nguồn media dùng chung cho cả game và practice.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã từ vựng |
| unit_id | INT | NOT NULL, FK → units.id | Unit |
| lesson_id | INT | NOT NULL, FK → lessons.id | Bài học |
| word | VARCHAR(100) | NOT NULL | Từ tiếng Anh |
| phonetic | VARCHAR(100) | NULL | Phiên âm |
| translation | VARCHAR(255) | NOT NULL | Nghĩa tiếng Việt |
| image_url | VARCHAR(500) | NULL | Ảnh minh họa |
| audio_url | VARCHAR(500) | NULL | Âm thanh phát âm |
| level | INT | default 1 | Cấp độ |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `grammar` — Ngữ pháp
Điểm ngữ pháp thuộc unit/lesson.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã ngữ pháp |
| unit_id | INT | NOT NULL, FK → units.id | Unit |
| lesson_id | INT | NOT NULL, FK → lessons.id | Bài học |
| grammar_type | VARCHAR(120) | NULL | Loại ngữ pháp (gom nhóm tab tổng hợp) |
| name | VARCHAR(255) | NULL | Tên điểm ngữ pháp |
| formula | VARCHAR(500) | NULL | Công thức (vd `S + V(s/es) + O`) |
| pattern | VARCHAR(255) | NOT NULL | Cột cũ (legacy), tự suy ra từ `formula`/`name` |
| explanation | TEXT | NULL | Cách dùng |
| example | TEXT | NULL | Ví dụ |
| translation | VARCHAR(500) | NULL | Bản dịch |
| order_index | INT | default 0 | Thứ tự hiển thị |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `lesson_games` — Game theo bài học (legacy)
Cấu hình game gắn với bài học. `GameSession` hiện dùng `game_config` thay cho bảng này.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã |
| lesson_id | INT | NOT NULL, FK → lessons.id | Bài học |
| game_type | ENUM(`signal-check`,`galaxy-match`,`planetary-order`,`rescue-mission`) | NOT NULL | Loại game |
| difficulty | ENUM(`easy`,`medium`,`hard`) | default `medium` | Độ khó |
| question_count | INT | default 10 | Số câu hỏi |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `game_config` — Cấu hình & nội dung game
Cấu hình và nội dung của một game (do admin soạn hoặc tự sinh).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã cấu hình |
| game_type | ENUM(`galaxy-match`,`planetary-order`,`rescue-mission`,`signal-check`,`voice-command`) | NOT NULL | 5 loại game |
| unit_id | INT | NULL, FK → units.id | Unit liên quan |
| lesson_id | INT | NULL, FK → lessons.id | Bài học liên quan |
| difficulty | ENUM(`easy`,`medium`,`hard`) | default `medium` | Độ khó |
| questions_count | INT | default 10 | Số câu hỏi |
| time_limit | INT | default 120 | Giới hạn thời gian (giây), 0 = không giới hạn |
| passing_score | INT | default 70 | Điểm tối thiểu để pass (%) |
| xp_reward | INT | default 50 | XP thưởng khi hoàn thành |
| content | JSON | NULL | Nội dung game do admin soạn; null = tự sinh từ vocabulary |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

---

## Nhóm 2 — Người dùng & tiến độ

### `users` — Người dùng
Bảng người dùng cốt lõi, khóa chính UUID. Mật khẩu được băm bằng bcrypt qua hook `beforeCreate`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã người dùng |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Tên đăng nhập |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email (validate `isEmail`) |
| password_hash | VARCHAR(255) | NOT NULL | Mật khẩu đã băm |
| display_name | VARCHAR(100) | NULL | Tên hiển thị |
| avatar | VARCHAR(500) | NULL | Ảnh đại diện |
| level | INT | default 1 | Cấp độ |
| subscription | ENUM(`Free`,`Premium`,`Super`) | default `Free` | Gói thuê bao |
| premium_expires_at | DATETIME | NULL | Hạn gói premium |
| subscription_cancelled_at | DATETIME | NULL | Thời điểm hủy gói |
| native_language | VARCHAR(50) | default `vi` | Ngôn ngữ mẹ đẻ |
| current_level | ENUM(`beginner`,`intermediate`,`advanced`) | default `beginner` | Trình độ hiện tại |
| learning_goal | ENUM(`travel`,`work`,`ielts`,`toeic`,`daily`,`academic`) | default `daily` | Mục tiêu học |
| daily_goal | INT | default 15 | Mục tiêu học mỗi ngày (phút) |
| joined_date | DATETIME | default now | Ngày tham gia |
| status | ENUM(`Active`,`Inactive`) | default `Active` | Trạng thái tài khoản |
| last_active | DATETIME | NULL | Lần hoạt động gần nhất |
| role | ENUM(`user`,`admin`) | default `user` | Vai trò |
| reset_token | VARCHAR(6) | NULL | Mã đặt lại mật khẩu |
| reset_token_expires | DATETIME | NULL | Hạn mã đặt lại |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `user_progress` — Tiến độ & thống kê người dùng
Quan hệ 1-1 với `users`. Hook `beforeUpdate` tính `level` từ `total_xp` và nâng `league` theo `weekly_xp` (chỉ tăng).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| user_id | CHAR(36) | NOT NULL, UNIQUE, FK → users.id | Người dùng |
| total_xp | INT | default 0 | XP tích lũy trọn đời |
| weekly_xp | INT | default 0 | XP tuần hiện tại |
| xp_this_week | INT | default 0 | XP trong tuần (cho bảng xếp hạng) |
| level | INT | default 1 | Cấp độ (tính từ total_xp) |
| streak_days | INT | default 0 | Số ngày hoạt động liên tiếp |
| last_active_date | DATE | NULL | Ngày hoạt động gần nhất |
| words_learned | INT | default 0 | Tổng số từ đã học |
| total_study_minutes | INT | default 0 | Tổng thời gian học (phút) |
| units_completed | INT | default 0 | Tổng số unit hoàn thành |
| lessons_completed | INT | default 0 | Tổng số lesson hoàn thành |
| league | ENUM(`Bronze`,`Silver`,`Gold`,`Diamond`) | default `Bronze` | Hạng đấu |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `user_settings` — Cài đặt người dùng
Quan hệ 1-1 với `users`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| user_id | CHAR(36) | NOT NULL, UNIQUE, FK → users.id | Người dùng |
| push_notifications | BOOLEAN | NOT NULL, default true | Bật thông báo đẩy |
| email_reminders | BOOLEAN | NOT NULL, default true | Nhắc nhở qua email |
| sound_effects | BOOLEAN | NOT NULL, default true | Hiệu ứng âm thanh |
| background_music | BOOLEAN | NOT NULL, default true | Nhạc nền |
| music_volume | INT | NOT NULL, default 70 | Âm lượng nhạc (0-100) |
| audio_volume | INT | NOT NULL, default 80 | Âm lượng hiệu ứng (0-100) |
| dark_mode | BOOLEAN | NOT NULL, default false | Chế độ tối |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `lesson_progress` — Tiến độ bài học
Tiến độ từng bài học của người dùng. Ràng buộc UNIQUE `(user_id, lesson_id)`. `stars_earned` giới hạn 0-3.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| unit_id | INT | NOT NULL, FK → units.id | Unit |
| lesson_id | INT | NOT NULL, FK → lessons.id | Bài học |
| status | ENUM(`locked`,`in-progress`,`completed`) | default `locked` | Trạng thái |
| stars_earned | INT | default 0 | Số sao đạt (0-3) |
| is_review | BOOLEAN | default false | Là lượt ôn tập |
| xp_earned | INT | default 0 | XP nhận được |
| correct_count | INT | default 0 | Số câu đúng |
| total_count | INT | default 0 | Tổng số câu |
| completed_at | DATETIME | NULL | Lần hoàn thành gần nhất |
| first_completed_at | DATETIME | NULL | Lần hoàn thành đầu tiên |
| created_at | DATETIME | default now | Thời điểm tạo |

### `user_vocabulary` — Tiến độ từ vựng
Tiến độ học từng từ của người dùng. Ràng buộc UNIQUE `(user_id, vocab_id)`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| vocab_id | INT | NOT NULL, FK → vocabulary.id | Từ vựng |
| is_favorite | BOOLEAN | default false | Đánh dấu yêu thích |
| mastery_level | INT | default 0 | Mức thành thạo (0-5) |
| correct_count | INT | default 0 | Số lần đúng |
| incorrect_count | INT | default 0 | Số lần sai |
| last_reviewed | DATETIME | NULL | Lần ôn gần nhất |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

---

## Nhóm 3 — Trò chơi

### `game_sessions` — Phiên chơi game

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã phiên |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người chơi |
| game_config_id | INT | NOT NULL, FK → game_config.id | Cấu hình game |
| status | ENUM(`in-progress`,`completed`,`abandoned`) | default `in-progress` | Trạng thái |
| score | INT | default 0 | Điểm (0-100) |
| correct_answers | INT | default 0 | Số câu đúng |
| total_questions | INT | NOT NULL | Tổng số câu |
| questions_data | JSON | NULL | Câu hỏi + đáp án của phiên |
| time_spent | INT | default 0 | Thời gian chơi (giây) |
| xp_earned | INT | default 0 | XP nhận được |
| started_at | DATETIME | default now | Bắt đầu |
| completed_at | DATETIME | NULL | Hoàn thành |
| created_at | DATETIME | default now | Thời điểm tạo |

### `game_wrong_answers` — Câu trả lời sai
Ghi lại các câu sai trong một phiên game.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| game_session_id | CHAR(36) | NOT NULL, FK → game_sessions.id | Phiên game |
| question_id | VARCHAR(100) | NULL | Mã câu hỏi |
| prompt | TEXT | NULL | Câu hỏi |
| user_answer | VARCHAR(255) | NULL | Đáp án người dùng chọn |
| correct_answer | VARCHAR(255) | NOT NULL | Đáp án đúng |
| created_at | DATETIME | default now | Thời điểm tạo |

---

## Nhóm 4 — Hội thoại AI

### `conversations` — Phiên hội thoại
Phiên luyện nói với AI theo chủ đề.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã phiên |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| topic | VARCHAR(100) | NOT NULL | Chủ đề/nhóm |
| topic_title | VARCHAR(255) | NOT NULL | Tiêu đề hiển thị |
| status | ENUM(`active`,`completed`,`abandoned`) | default `active` | Trạng thái |
| total_messages | INT | default 0 | Tổng số tin nhắn |
| duration_seconds | INT | default 0 | Tổng thời lượng (giây) |
| started_at | DATETIME | default now | Bắt đầu |
| ended_at | DATETIME | NULL | Kết thúc |

### `conversation_messages` — Tin nhắn hội thoại

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã tin nhắn |
| conversation_id | CHAR(36) | NOT NULL, FK → conversations.id | Phiên hội thoại |
| role | ENUM(`user`,`assistant`,`system`) | NOT NULL | Vai người gửi |
| content | TEXT | NOT NULL | Nội dung |
| tokens_used | INT | default 0 | Số token dùng |
| created_at | DATETIME | default now | Thời điểm tạo |

---

## Nhóm 5 — Nhiệm vụ & thành tích

### `missions` — Nhiệm vụ
Định nghĩa nhiệm vụ hằng ngày và thành tích.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã nhiệm vụ |
| type | ENUM(`daily`,`achievement`) | NOT NULL | Loại |
| code | VARCHAR(50) | NOT NULL, UNIQUE | Mã định danh (login, flashcard, lesson...) |
| title | VARCHAR(100) | NOT NULL | Tiêu đề |
| description | TEXT | NOT NULL | Mô tả |
| icon | VARCHAR(50) | default `🌟` | Biểu tượng |
| badge | VARCHAR(255) | NULL | Huy hiệu |
| medal | VARCHAR(50) | NULL | Huy chương |
| target | INT | NOT NULL, default 1 | Số lần cần đạt |
| xp_reward | INT | NOT NULL, default 10 | XP thưởng |
| chain_code | VARCHAR(50) | NULL | Mã nhiệm vụ trước (chuỗi thành tích) |
| order_index | INT | default 0 | Thứ tự hiển thị |
| is_active | BOOLEAN | default true | Đang kích hoạt |
| reset_daily | BOOLEAN | default false | Reset lúc nửa đêm |
| start_date | DATETIME | NULL | Khả dụng từ ngày |
| end_date | DATETIME | NULL | Khả dụng đến ngày |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `user_missions` — Tiến độ nhiệm vụ
Ràng buộc UNIQUE `(user_id, mission_id, reset_date)`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| mission_id | CHAR(36) | NOT NULL, FK → missions.id | Nhiệm vụ |
| progress | INT | default 0 | Tiến độ hiện tại tới target |
| status | ENUM(`in_progress`,`completed`,`claimed`) | default `in_progress` | Trạng thái |
| claimed_at | DATETIME | NULL | Thời điểm nhận thưởng |
| last_updated | DATETIME | default now | Lần cập nhật tiến độ |
| reset_date | DATETIME | NULL | Ngày reset nhiệm vụ hằng ngày (DataTypes.DATE) |
| created_at | DATETIME | default now | Thời điểm tạo |

---

## Nhóm 6 — Thanh toán

### `payment_orders` — Đơn thanh toán
Đơn nâng cấp gói, tích hợp SePay QR.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã đơn |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| amount | DECIMAL(10,2) | NOT NULL | Số tiền |
| package_type | VARCHAR(50) | NOT NULL | Gói (vd Premium-Monthly, Super-Monthly) |
| duration_months | INT | NULL | Số tháng |
| premium_expires_at | DATETIME | NULL | Hạn premium sau khi mua |
| transfer_type | VARCHAR(20) | NULL | Loại chuyển khoản (qr) |
| trans_id | VARCHAR(100) | NULL | Mã giao dịch ngân hàng |
| transfer_amount | DECIMAL(10,2) | NULL | Số tiền chuyển thực tế |
| transfer_date | DATETIME | NULL | Thời điểm chuyển |
| account_number | VARCHAR(50) | NULL | Số tài khoản người gửi |
| account_holder | VARCHAR(200) | NULL | Tên chủ tài khoản người gửi |
| bank_code | VARCHAR(20) | NULL | Mã ngân hàng người gửi |
| description | VARCHAR(500) | NULL | Nội dung chuyển khoản |
| status | ENUM(`pending`,`approved`,`rejected`,`cancelled`) | default `pending` | Trạng thái |
| admin_note | VARCHAR(500) | NULL | Ghi chú của admin |
| reviewed_by | CHAR(36) | NULL, FK → users.id | Admin duyệt đơn |
| reviewed_at | DATETIME | NULL | Thời điểm duyệt |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

---

## Nhóm 7 — Phản hồi & thông báo

### `feedback` — Phản hồi người dùng

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| user_id | CHAR(36) | NULL, FK → users.id | Người gửi (null nếu ẩn danh) |
| type | ENUM(`Review`,`Suggestion`,`Bug Report`) | NOT NULL | Loại phản hồi |
| rating | INT | NULL | Đánh giá 1-5 sao |
| message | TEXT | NOT NULL | Nội dung |
| status | ENUM(`unread`,`read`,`resolved`) | default `unread` | Trạng thái xử lý |
| created_at | DATETIME | default now | Thời điểm tạo |
| resolved_at | DATETIME | NULL | Thời điểm xử lý xong |

### `notifications` — Thông báo

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| recipient_user_id | CHAR(36) | NULL, FK → users.id | Người nhận (null = cấp vai trò, vd toàn admin) |
| audience_role | ENUM(`user`,`admin`) | NOT NULL, default `user` | Đối tượng |
| type | VARCHAR(50) | NOT NULL, default `system` | Loại (feedback_submitted, broadcast, level_reached, friend_request, payment...) |
| campaign_id | CHAR(36) | NULL | Liên kết về campaign (chống trùng) |
| title | VARCHAR(150) | NOT NULL | Tiêu đề |
| message | TEXT | NOT NULL | Nội dung |
| metadata | JSON | NULL | Dữ liệu bổ sung |
| is_read | BOOLEAN | NOT NULL, default false | Đã đọc |
| read_at | DATETIME | NULL | Thời điểm đọc |
| created_at | DATETIME | default now | Thời điểm tạo |

### `notification_campaigns` — Chiến dịch thông báo
Chiến dịch broadcast / theo điều kiện do admin tạo.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| title | VARCHAR(150) | NOT NULL | Tiêu đề |
| message | TEXT | NOT NULL | Nội dung |
| image_url | VARCHAR(500) | NULL | Ảnh minh họa |
| audience | ENUM(`all`,`free`,`premium`,`inactive`) | NOT NULL, default `all` | Đối tượng nhận |
| trigger_type | ENUM(`schedule`,`level_reached`,`units_completed`,`streak`,`xp_milestone`,`resume_activity`) | NOT NULL, default `schedule` | Loại kích hoạt |
| trigger_config | JSON | NULL | Cấu hình điều kiện |
| status | ENUM(`draft`,`scheduled`,`active`,`sent`,`cancelled`) | NOT NULL, default `draft` | Trạng thái |
| created_by | CHAR(36) | NULL | Admin tạo (tham chiếu logic users.id) |
| sent_at | DATETIME | NULL | Thời điểm gửi |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `notification_templates` — Mẫu thông báo
Mẫu thông báo cá nhân hóa theo sự kiện.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã |
| event | VARCHAR(50) | NOT NULL, UNIQUE | Sự kiện (rank_up, premium_purchase, friend_request...) |
| title | VARCHAR(150) | NOT NULL | Tiêu đề mẫu |
| body | TEXT | NOT NULL | Nội dung mẫu (có placeholder) |
| variables | JSON | NULL | Danh sách placeholder cho phép |
| enabled | BOOLEAN | NOT NULL, default true | Đang bật |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

---

## Nhóm 8 — Mạng xã hội (bạn bè & chat)

### `friendships` — Quan hệ bạn bè
Ràng buộc UNIQUE `(requester_id, addressee_id)`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| requester_id | CHAR(36) | NOT NULL, FK → users.id | Người gửi lời mời |
| addressee_id | CHAR(36) | NOT NULL, FK → users.id | Người nhận lời mời |
| status | ENUM(`pending`,`accepted`) | default `pending` | Trạng thái |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `direct_messages` — Tin nhắn trực tiếp
Tin nhắn 1-1 giữa hai người dùng (text/image/voice).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| sender_id | CHAR(36) | NOT NULL, FK → users.id | Người gửi |
| receiver_id | CHAR(36) | NOT NULL, FK → users.id | Người nhận |
| type | ENUM(`text`,`image`,`voice`) | default `text` | Loại tin nhắn |
| content | TEXT | NOT NULL | Nội dung |
| media_url | VARCHAR(500) | NULL | URL ảnh/âm thanh |
| voice_duration | INT | NULL | Thời lượng voice (giây) |
| read_at | DATETIME | NULL | Thời điểm đã đọc |
| created_at | DATETIME | default now | Thời điểm gửi |

---

## Nhóm 9 — Luyện tập (Practice)

### `practice_topics` — Chủ đề luyện tập
Chủ đề theo từng chế độ. Ràng buộc UNIQUE `(mode, slug)`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| mode | ENUM(`listen-fill`,`listen-repeat`,`read-answer`,`read-story`) | NOT NULL | Chế độ luyện tập |
| slug | VARCHAR(100) | NOT NULL | Định danh URL |
| title | VARCHAR(150) | NOT NULL | Tiêu đề |
| description | VARCHAR(500) | NULL | Mô tả |
| emoji | VARCHAR(50) | NULL | Biểu tượng |
| color | VARCHAR(100) | NULL | Màu hiển thị |
| image_url | VARCHAR(500) | NULL | Ảnh |
| order_index | INT | default 0 | Thứ tự hiển thị |
| is_active | BOOLEAN | default true | Đang kích hoạt |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `practice_items` — Mục luyện tập
Ràng buộc UNIQUE `(topic_id, order_index)`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| topic_id | CHAR(36) | NOT NULL, FK → practice_topics.id | Chủ đề |
| order_index | INT | default 0 | Thứ tự |
| title | VARCHAR(150) | NULL | Tiêu đề |
| prompt | VARCHAR(500) | NULL | Đề bài |
| passage | TEXT | NULL | Đoạn văn |
| image_url | VARCHAR(500) | NULL | Ảnh |
| audio_text | TEXT | NULL | Văn bản đọc thành tiếng |
| translation | TEXT | NULL | Bản dịch |
| content_data | JSON | NULL | Dữ liệu nội dung có cấu trúc |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `practice_attempts` — Lượt làm luyện tập

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| topic_id | CHAR(36) | NOT NULL, FK → practice_topics.id | Chủ đề |
| mode | ENUM(`listen-fill`,`listen-repeat`,`read-answer`,`read-story`) | NOT NULL | Chế độ |
| score | INT | default 0 | Điểm |
| correct_count | INT | default 0 | Số câu đúng |
| total_count | INT | default 0 | Tổng số câu |
| time_spent | INT | default 0 | Thời gian (giây) |
| xp_earned | INT | default 0 | XP nhận được |
| status | ENUM(`in-progress`,`completed`,`abandoned`) | default `in-progress` | Trạng thái |
| answers | JSON | NULL | Đáp án người dùng |
| started_at | DATETIME | default now | Bắt đầu |
| completed_at | DATETIME | NULL | Hoàn thành |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `practice_progress` — Tiến độ luyện tập
Ràng buộc UNIQUE `(user_id, topic_id)`.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| topic_id | CHAR(36) | NOT NULL, FK → practice_topics.id | Chủ đề |
| completed_items | INT | default 0 | Số mục đã hoàn thành |
| total_items | INT | default 0 | Tổng số mục |
| best_score | INT | default 0 | Điểm cao nhất |
| attempts_count | INT | default 0 | Số lượt làm |
| last_attempt_at | DATETIME | NULL | Lần làm gần nhất |
| completed_at | DATETIME | NULL | Hoàn thành chủ đề |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

---

## Nhóm 10 — Kiểm tra đầu vào (Placement)

### `placement_topics` — Chủ đề kiểm tra đầu vào
Ánh xạ sang unit để mở khóa khi thành thạo.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã |
| name | VARCHAR(100) | NOT NULL | Tên chủ đề (tiếng Anh) |
| name_vi | VARCHAR(150) | NOT NULL | Tên chủ đề (tiếng Việt) |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | Định danh |
| icon | VARCHAR(10) | default `📚` | Biểu tượng |
| difficulty_range | ENUM(`beginner`,`intermediate`,`advanced`,`all`) | default `all` | Mức độ |
| min_age | INT | default 8 | Tuổi tối thiểu |
| max_age | INT | default 18 | Tuổi tối đa |
| unit_id | INT | NULL, FK → units.id | Unit được mở khi thành thạo |
| unit_order | INT | NULL | Thứ tự hiển thị (khớp thứ tự unit) |
| vocabulary_keywords | JSON | NULL | Mảng từ khóa định hướng sinh câu hỏi AI |
| is_active | BOOLEAN | default true | Đang kích hoạt |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `placement_test_sessions` — Phiên kiểm tra đầu vào
`age` validate 8-18. Bật timestamps tự động.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã phiên |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| age | INT | NOT NULL | Tuổi (8-18) |
| level_input | ENUM(`beginner`,`intermediate`,`advanced`) | NOT NULL | Trình độ tự khai |
| selected_topics | JSON | NOT NULL | Mảng slug chủ đề đã chọn |
| questions_data | JSON | NOT NULL | Toàn bộ câu hỏi AI sinh (kèm đáp án) |
| answers_data | JSON | NULL | Đáp án người dùng |
| score | INT | NULL | Điểm tổng 0-100 |
| section_scores | JSON | NULL | Điểm theo từng section |
| unlock_progress | JSON | NULL | Kết quả mở khóa chủ đề/unit |
| passed | BOOLEAN | NULL | Đạt hay không |
| cefr_level | ENUM(`A1`,`A2`,`B1`,`B2`,`C1`) | NULL | Trình độ CEFR |
| status | ENUM(`in-progress`,`completed`,`abandoned`) | default `in-progress` | Trạng thái |
| completed_at | DATETIME | NULL | Hoàn thành |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

---

## Nhóm 11 — Bài thi Checkpoint & Challenge

### `unit_test_configs` — Cấu hình bài thi
Cấu hình bài thi checkpoint (vượt nhiều unit) hoặc challenge (1 unit). Bật timestamps tự động.

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | VARCHAR(50) | PK | Mã (vd `checkpoint-1`, `unit-1`) |
| test_type | ENUM(`checkpoint`,`challenge`) | NOT NULL | Loại bài thi |
| title | VARCHAR(255) | NOT NULL | Tiêu đề |
| description | TEXT | NULL | Mô tả chi tiết |
| units_covered | JSON | NULL | Mảng unit ID `[1,2,3]` (cho checkpoint) |
| unit_id | INT | NULL | Unit ID (cho challenge) |
| pass_threshold | INT | default 80 | % để pass (checkpoint 80, challenge 100) |
| total_score | INT | default 20 | Tổng điểm (checkpoint 20, challenge 10) |
| is_active | BOOLEAN | default true | Đang kích hoạt |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `unit_test_sessions` — Phiên làm bài thi

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã phiên |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người dùng |
| test_type | ENUM(`checkpoint`,`challenge`) | NOT NULL | Loại bài thi |
| test_id | VARCHAR(50) | NOT NULL, FK → unit_test_configs.id | Bài thi |
| units_covered | JSON | NULL | Mảng unit ID (cho checkpoint) |
| unit_id | INT | NULL | Unit ID (cho challenge) |
| status | ENUM(`in_progress`,`completed`,`abandoned`) | default `in_progress` | Trạng thái |
| answers_data | JSON | NULL | Đáp án người dùng |
| score | INT | default 0 | Tổng điểm |
| pass | BOOLEAN | default false | Đạt hay không |
| section_scores | JSON | NULL | Điểm theo section |
| section_details | JSON | NULL | Chi tiết từng câu |
| time_spent_seconds | INT | default 0 | Thời gian làm bài (giây) |
| completed_at | DATETIME | NULL | Hoàn thành |
| created_at | DATETIME | default now | Thời điểm tạo |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

### `question_checkpoints` — Ngân hàng câu hỏi checkpoint

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã câu hỏi |
| checkpoint_id | VARCHAR(50) | NOT NULL, FK → unit_test_configs.id | Bài checkpoint |
| section | ENUM(`A`,`B`,`C`,`D`,`E`) | NOT NULL | Section (A:match B:listen_write C:fill_blank D:unscramble E:read_speak) |
| question_type | ENUM(`match`,`listen_write`,`fill_blank`,`unscramble`,`read_speak`) | NOT NULL | Loại câu hỏi |
| content | JSON | NOT NULL | Nội dung câu hỏi (không có đáp án) |
| correct_answer | JSON | NOT NULL | Đáp án đúng |
| score | INT | NOT NULL, default 1 | Điểm câu này |
| display_order | INT | NOT NULL, default 0 | Thứ tự trong section |
| is_active | BOOLEAN | default true | Đang kích hoạt |
| created_at | DATETIME | NOT NULL, default now | Thời điểm tạo |
| updated_at | DATETIME | NOT NULL, default now | Thời điểm cập nhật |

### `question_challenges` — Ngân hàng câu hỏi challenge

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | INT | PK, AUTO_INCREMENT | Mã câu hỏi |
| unit_id | INT | NOT NULL, FK → units.id | Unit |
| section | ENUM(`A`,`B`,`C`,`D`) | NOT NULL | Section (A:match B:listen_write C:word_bank D:listen_repeat) |
| question_type | ENUM(`match`,`listen_write`,`fill_blank`,`word_bank`,`listen_repeat`) | NOT NULL | Loại câu hỏi |
| content | JSON | NOT NULL | Nội dung câu hỏi (không có đáp án) |
| correct_answer | JSON | NOT NULL | Đáp án đúng |
| score | INT | NOT NULL, default 1 | Điểm câu này |
| display_order | INT | NOT NULL, default 0 | Thứ tự trong section |
| is_active | BOOLEAN | default true | Đang kích hoạt |
| created_at | DATETIME | NOT NULL, default now | Thời điểm tạo |
| updated_at | DATETIME | NOT NULL, default now | Thời điểm cập nhật |

---

## Nhóm 12 — Hệ thống

### `system_state` — Trạng thái hệ thống
Kho key/value cho marker runtime (vd lần reset bảng xếp hạng tuần gần nhất).

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| key | VARCHAR(100) | PK | Khóa định danh |
| value | TEXT | NULL | Giá trị |
| updated_at | DATETIME | default now | Thời điểm cập nhật |

---

## Nhóm 13 — Chấm sửa bài viết (Writing) — *MỚI*

> Bảng phục vụ tính năng đang phát triển. **Luồng**: user gửi bài viết (gõ text **hoặc** tải ảnh) → nếu là ảnh, AI **OCR** trích xuất văn bản → AI phát hiện **lỗi chính tả/ngữ pháp** và sinh **bản viết lại gợi ý** → kết quả lưu lại để user **xem lại các bài cũ**. Bảng này **chưa có trong Sequelize models** — là thiết kế cho tính năng mới.

### `writing_submissions` — Bài viết & kết quả chấm sửa

| Cột | Kiểu | Ràng buộc | Mô tả |
|-----|------|-----------|-------|
| id | CHAR(36) | PK (UUID) | Mã bài nộp |
| user_id | CHAR(36) | NOT NULL, FK → users.id | Người gửi |
| input_type | ENUM(`text`,`image`) | NOT NULL, default `text` | Cách gửi: gõ text hay tải ảnh |
| image_url | VARCHAR(500) | NULL | URL ảnh bài viết (nếu gửi ảnh; lưu trên Cloudinary) |
| original_text | TEXT | NULL | Bài viết của user (text gõ vào, hoặc văn bản OCR từ ảnh) |
| corrections | JSON | NULL | Mảng lỗi AI phát hiện: `[{type:'spelling'\|'grammar', original, suggestion, explanation}]` |
| suggested_rewrite | TEXT | NULL | Bài viết gợi ý viết lại do AI sinh |
| status | ENUM(`processing`,`completed`,`failed`) | NOT NULL, default `processing` | Trạng thái xử lý OCR/AI |
| created_at | DATETIME | default now | Thời điểm gửi |
| updated_at | DATETIME | default now | Thời điểm cập nhật (sau khi AI trả kết quả) |

**Quan hệ:** `user_id` → `users.id` (CASCADE). "Xem lại bài cũ" = truy vấn theo `user_id`, sắp xếp `created_at DESC`. JSON đầu ra của AI gồm bài viết kèm lỗi (`original_text` + `corrections`) và bản viết lại (`suggested_rewrite`).

---

## Tổng hợp quan hệ (Foreign Keys)

| Bảng nguồn (cột) | → Bảng đích (cột) | ON DELETE |
|------------------|-------------------|-----------|
| lessons.unit_id | units.id | CASCADE |
| vocabulary.unit_id | units.id | CASCADE |
| vocabulary.lesson_id | lessons.id | CASCADE |
| grammar.unit_id | units.id | CASCADE |
| grammar.lesson_id | lessons.id | CASCADE |
| lesson_games.lesson_id | lessons.id | CASCADE |
| game_config.unit_id | units.id | CASCADE |
| game_config.lesson_id | lessons.id | CASCADE |
| user_progress.user_id | users.id | CASCADE (1-1) |
| user_settings.user_id | users.id | CASCADE (1-1) |
| lesson_progress.user_id | users.id | CASCADE |
| lesson_progress.unit_id | units.id | CASCADE |
| lesson_progress.lesson_id | lessons.id | CASCADE |
| user_vocabulary.user_id | users.id | CASCADE |
| user_vocabulary.vocab_id | vocabulary.id | CASCADE |
| game_sessions.user_id | users.id | CASCADE |
| game_sessions.game_config_id | game_config.id | CASCADE |
| game_wrong_answers.game_session_id | game_sessions.id | CASCADE |
| conversations.user_id | users.id | CASCADE |
| conversation_messages.conversation_id | conversations.id | CASCADE |
| user_missions.user_id | users.id | CASCADE |
| user_missions.mission_id | missions.id | CASCADE |
| payment_orders.user_id | users.id | CASCADE |
| payment_orders.reviewed_by | users.id | SET NULL |
| feedback.user_id | users.id | SET NULL |
| notifications.recipient_user_id | users.id | CASCADE |
| notification_campaigns.created_by | users.id | (tham chiếu logic, model không khai báo FK) |
| friendships.requester_id | users.id | CASCADE |
| friendships.addressee_id | users.id | CASCADE |
| direct_messages.sender_id | users.id | CASCADE |
| direct_messages.receiver_id | users.id | CASCADE |
| practice_items.topic_id | practice_topics.id | CASCADE |
| practice_attempts.user_id | users.id | CASCADE |
| practice_attempts.topic_id | practice_topics.id | CASCADE |
| practice_progress.user_id | users.id | CASCADE |
| practice_progress.topic_id | practice_topics.id | CASCADE |
| placement_topics.unit_id | units.id | — |
| placement_test_sessions.user_id | users.id | CASCADE |
| unit_test_sessions.user_id | users.id | CASCADE |
| unit_test_sessions.test_id | unit_test_configs.id | — |
| question_checkpoints.checkpoint_id | unit_test_configs.id | CASCADE |
| question_challenges.unit_id | units.id | CASCADE |
| writing_submissions.user_id | users.id | CASCADE |

### Tóm tắt lực lượng quan hệ (cardinality)

- **1:1** — `users`↔`user_progress`, `users`↔`user_settings`.
- **1:N** — `users`→(lesson_progress, user_vocabulary, game_sessions, conversations, user_missions, payment_orders, feedback, notifications, friendships, direct_messages, practice_attempts, practice_progress, placement_test_sessions, unit_test_sessions, writing_submissions); `units`→(lessons, vocabulary, grammar, game_config, lesson_progress, placement_topics, question_challenges); `lessons`→(vocabulary, grammar, lesson_games, game_config, lesson_progress); `game_config`→`game_sessions`→`game_wrong_answers`; `conversations`→`conversation_messages`; `missions`→`user_missions`; `practice_topics`→(practice_items, practice_attempts, practice_progress); `unit_test_configs`→(unit_test_sessions, question_checkpoints).

---

## Index & ràng buộc UNIQUE nổi bật

- `users`: UNIQUE `username`, UNIQUE `email`; index `status`.
- `user_progress`: UNIQUE `user_id`; index `league`.
- `user_settings`: UNIQUE `user_id`.
- `lesson_progress`: UNIQUE `(user_id, lesson_id)`.
- `user_vocabulary`: UNIQUE `(user_id, vocab_id)`; index `is_favorite`.
- `user_missions`: UNIQUE `(user_id, mission_id, reset_date)`.
- `missions`: UNIQUE `code`.
- `notification_templates`: UNIQUE `event`.
- `friendships`: UNIQUE `(requester_id, addressee_id)`; index `addressee_id`.
- `direct_messages`: index `(sender_id, receiver_id, created_at)`, `(receiver_id, read_at)`.
- `conversation_messages`: index `(conversation_id, created_at)`.
- `practice_topics`: UNIQUE `(mode, slug)`.
- `practice_items`: UNIQUE `(topic_id, order_index)`.
- `practice_progress`: UNIQUE `(user_id, topic_id)`.
- `placement_topics`: UNIQUE `slug`.
- `game_sessions`: index `user_id`, `game_config_id`, `created_at`, `status`.

---

**Hết tài liệu — 35 bảng đang chạy + `writing_submissions` mới (tính năng chấm sửa writing). Sơ đồ ERD trực quan: xem [database.md](database.md).**
