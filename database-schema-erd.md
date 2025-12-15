# Database Schema & ERD Documentation
## Gamified English Learning Platform

Last Updated: December 2025
Version: 2.0

---

## 📊 Entity Relationship Diagram (ERD)

\`\`\`
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE SCHEMA                             │
│                   Gamified English Learning Platform                │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│     USERS        │─────┬───│  USER_PROGRESS   │
│==================│     │   │==================│
│ PK id            │     │   │ PK id            │
│    username      │     │   │ FK user_id       │
│    email         │     │   │    total_xp      │
│    password_hash │     │   │    weekly_xp     │
│    display_name  │     │   │    level         │
│    avatar        │     │   │    streak_days   │
│    level         │     │   │    last_active   │
│    subscription  │     │   │    league        │
│    native_lang   │     │   │    created_at    │
│    current_level │     │   │    updated_at    │
│    learning_goal │     │   └──────────────────┘
│    daily_goal    │     │
│    joined_date   │     │   ┌──────────────────┐
│    status        │     ├───│  LESSON_PROGRESS │
│    created_at    │     │   │==================│
│    updated_at    │     │   │ PK id            │
└──────────────────┘     │   │ FK user_id       │
        │                │   │ FK unit_id       │
        │                │   │ FK lesson_id     │
        │                │   │    status        │
        │                │   │    stars_earned  │
        │                │   │    is_review     │
        │                │   │    xp_earned     │
        │                │   │    correct_count │
        │                │   │    total_count   │
        │                │   │    completed_at  │
        │                │   │    first_completed_at│
        │                │   │    created_at    │
        ├────────────────┤   └──────────────────┘
        │                │
        │                │   ┌──────────────────┐
        │                ├───│ USER_ACHIEVEMENTS│
        │                │   │==================│
        │                │   │ PK id            │
        │                │   │ FK user_id       │
        │                │   │ FK achievement_id│
        │                │   │    progress      │
        │                │   │    status        │
        │                │   │    unlocked_at   │
        │                │   │    claimed_at    │
        │                │   └──────────────────┘
        │                │
        │                │   ┌──────────────────┐
        │                ├───│  USER_DAILY_TASKS│
        │                │   │==================│
        │                │   │ PK id            │
        │                │   │ FK user_id       │
        │                │   │ FK daily_task_id │
        │                │   │    progress      │
        │                │   │    status        │
        │                │   │    completed_at  │
        │                │   │    claimed_at    │
        │                │   │    week_number   │
        │                │   └──────────────────┘
        │                │
        │                │   ┌──────────────────┐
        │                └───│    FEEDBACK      │
        │                    │==================│
        │                    │ PK id            │
        │                    │ FK user_id       │
        │                    │    type          │
        │                    │    rating        │
        │                    │    message       │
        │                    │    status        │
        │                    │    created_at    │
        │                    │    resolved_at   │
        │                    └──────────────────┘
        │
        │
┌───────┴────────┐
│                │
│  ┌──────────────────┐         ┌──────────────────┐
│  │     UNITS        │─────────│    LESSONS       │
│  │==================│         │==================│
│  │ PK id            │         │ PK id            │
│  │    title         │         │ FK unit_id       │
│  │    subtitle      │         │    title         │
│  │    icon          │         │    type          │
│  │    order_index   │         │    order_index   │
│  │    total_lessons │         │    created_at    │
│  │    created_at    │         │    updated_at    │
│  │    updated_at    │         └──────────────────┘
│  └──────────────────┘                  │
│                                        │
│  ┌──────────────────┐                  │
│  │   CHECKPOINTS    │                  │
│  │==================│                  │
│  │ PK id            │                  │
│  │    title         │                  │
│  │    subtitle      │                  │
│  │    after_unit_id │                  │
│  │    unlocked      │                  │
│  │    xp_reward     │                  │
│  │    created_at    │                  │
│  └──────────────────┘                  │
│           │                            │
│           │                            │
│  ┌────────┴──────────┐                 │
│  │ CHECKPOINT_SKIPS  │                 │
│  │===================│                 │
│  │ PK id             │                 │
│  │ FK checkpoint_id  │                 │
│  │ FK unit_id        │                 │
│  └───────────────────┘                 │
│                                        │
│                                        │
└────────────────────┬───────────────────┘
                     │
            ┌────────┴────────┐
            │                 │
   ┌──────────────────┐  ┌──────────────────┐
   │   VOCABULARY     │  │  LESSON_GAMES    │
   │==================│  │==================│
   │ PK id            │  │ PK id            │
   │ FK unit_id       │  │ FK lesson_id     │
   │ FK lesson_id     │  │    game_type     │
   │    word          │  │    difficulty    │
   │    phonetic      │  │    question_count│
   │    translation   │  │    created_at    │
   │    image_url     │  │    updated_at    │
   │    audio_url     │  └──────────────────┘
   │    level         │
   │    created_at    │  ┌──────────────────┐
   │    updated_at    │  │  GAME_SESSIONS   │
   └──────────────────┘  │==================│
                         │ PK id            │
                         │ FK user_id       │
                         │ FK lesson_game_id│
                         │    score         │
                         │    correct_count │
                         │    total_count   │
                         │    time_spent    │
                         │    xp_earned     │
                         │    completed_at  │
                         │    created_at    │
                         └──────────────────┘
                                 │
                                 │
                         ┌───────┴──────────┐
                         │ GAME_WRONG_ANS   │
                         │==================│
                         │ PK id            │
                         │ FK game_session  │
                         │    question_id   │
                         │    prompt        │
                         │    user_answer   │
                         │    correct_answer│
                         │    created_at    │
                         └──────────────────┘


┌──────────────────┐         ┌──────────────────┐
│  ACHIEVEMENTS    │         │   DAILY_TASKS    │
│==================│         │==================│
│ PK id            │         │ PK id            │
│    title         │         │    title         │
│    description   │         │    description   │
│    target        │         │    target        │
│    reward_xp     │         │    reward_xp     │
│    icon          │         │    icon          │
│    badge         │         │    task_type     │
│    medal         │         │    week_number   │
│    chain_id      │         │    created_at    │
│    created_at    │         │    updated_at    │
└──────────────────┘         └──────────────────┘


┌──────────────────┐         ┌──────────────────┐
│   LEADERBOARD    │         │    LEAGUES       │
│==================│         │==================│
│ PK id            │         │ PK id            │
│ FK user_id       │         │    name          │
│    weekly_xp     │         │    color         │
│    rank          │         │    icon          │
│    league_id     │         │    min_xp        │
│    week_number   │         │    max_xp        │
│    season        │         │    created_at    │
│    created_at    │         └──────────────────┘
│    updated_at    │
└──────────────────┘

┌──────────────────┐
│  SUBSCRIPTIONS   │
│==================│
│ PK id            │
│ FK user_id       │
│    type          │
│    start_date    │
│    renewal_date  │
│    status        │
│    created_at    │
│    updated_at    │
└──────────────────┘
        │
        │
┌───────┴──────────┐
│   TRANSACTIONS   │
│==================│
│ PK id            │
│ FK subscription  │
│    amount        │
│    currency      │
│    status        │
│    payment_method│
│    created_at    │
└──────────────────┘
\`\`\`

---

## 📋 Detailed Table Specifications

### 1. USERS Table
Stores all user account information and authentication data.

**Fields:**
- `id` (UUID, PRIMARY KEY): Unique user identifier
- `username` (VARCHAR(50), UNIQUE, NOT NULL): User's login name
- `email` (VARCHAR(255), UNIQUE, NOT NULL): User's email address
- `password_hash` (VARCHAR(255), NOT NULL): Encrypted password
- `display_name` (VARCHAR(100)): Displayed name in app
- `avatar` (VARCHAR(500)): URL to avatar image
- `level` (INTEGER, DEFAULT 1): User's current level
- `subscription` (ENUM('Free', 'Premium', 'Super'), DEFAULT 'Free'): Subscription tier
- `native_language` (VARCHAR(50)): User's native language
- `current_level` (ENUM('beginner', 'intermediate', 'advanced')): English proficiency
- `learning_goal` (ENUM('travel', 'work', 'ielts', 'toeic', 'daily', 'academic')): Learning objective
- `daily_goal` (INTEGER): Daily study goal in minutes
- `joined_date` (DATE, NOT NULL): Account creation date
- `status` (ENUM('Active', 'Inactive'), DEFAULT 'Active'): Account status
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP ON UPDATE)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`username`)
- UNIQUE KEY (`email`)
- INDEX (`status`)

---

### 2. USER_PROGRESS Table
Tracks user's overall progress and XP.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, NOT NULL)
- `total_xp` (INTEGER, DEFAULT 0): Lifetime XP earned
- `weekly_xp` (INTEGER, DEFAULT 0): Current week XP
- `level` (INTEGER, DEFAULT 1): Calculated from total_xp
- `streak_days` (INTEGER, DEFAULT 0): Consecutive days of activity
- `last_active_date` (DATE): Last login/activity date
- `league` (ENUM('Bronze', 'Silver', 'Gold', 'Diamond'), DEFAULT 'Bronze')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relationships:**
- `user_id` → `users.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`user_id`)
- INDEX (`weekly_xp` DESC) for leaderboard queries

---

### 3. UNITS Table
Stores learning units (main course modules).

**Fields:**
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `title` (VARCHAR(100), NOT NULL): e.g., "Unit 1"
- `subtitle` (VARCHAR(255)): e.g., "Greetings & Basics"
- `icon` (VARCHAR(10)): Emoji icon for unit
- `order_index` (INTEGER, NOT NULL): Display order
- `total_lessons` (INTEGER, DEFAULT 15): Number of lessons in unit
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`order_index`)

---

### 4. LESSONS Table
Stores individual lessons within units.

**Fields:**
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `unit_id` (INTEGER, FOREIGN KEY → units.id, NOT NULL)
- `title` (VARCHAR(100), NOT NULL): e.g., "Lesson 1"
- `type` (ENUM('vocabulary', 'practice', 'test'), NOT NULL)
- `order_index` (INTEGER, NOT NULL): Order within unit
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relationships:**
- `unit_id` → `units.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`unit_id`, `order_index`)

---

### 5. VOCABULARY Table
Stores all vocabulary words with translations and media.

**Fields:**
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `unit_id` (INTEGER, FOREIGN KEY → units.id, NOT NULL)
- `lesson_id` (INTEGER, FOREIGN KEY → lessons.id, NOT NULL)
- `word` (VARCHAR(100), NOT NULL): English word
- `phonetic` (VARCHAR(100)): IPA pronunciation
- `translation` (VARCHAR(255), NOT NULL): Native language translation
- `image_url` (VARCHAR(500)): Reference image
- `audio_url` (VARCHAR(500)): Pronunciation audio
- `level` (INTEGER, DEFAULT 1): Difficulty level
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relationships:**
- `unit_id` → `units.id` (CASCADE DELETE)
- `lesson_id` → `lessons.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`unit_id`, `lesson_id`)
- INDEX (`word`)

---

### 6. LESSON_PROGRESS Table
Tracks user progress for each lesson.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, NOT NULL)
- `unit_id` (INTEGER, FOREIGN KEY → units.id, NOT NULL)
- `lesson_id` (INTEGER, FOREIGN KEY → lessons.id, NOT NULL)
- `status` (ENUM('locked', 'in-progress', 'completed'), DEFAULT 'locked')
- `stars_earned` (INTEGER, DEFAULT 0): Stars achieved (1-3)
- `is_review` (BOOLEAN, DEFAULT false): Whether this is a replay/review
- `xp_earned` (INTEGER, DEFAULT 0): XP earned from this lesson
- `correct_count` (INTEGER, DEFAULT 0)
- `total_count` (INTEGER, DEFAULT 0)
- `completed_at` (TIMESTAMP NULL)
- `first_completed_at` (TIMESTAMP NULL): First time completion (for review detection)
- `created_at` (TIMESTAMP)

**XP Calculation Rules:**
1. **Regular Lessons (1-4) - First Completion:**
   - 1 star: 50 XP
   - 2 stars: 100 XP
   - 3 stars: 150 XP

2. **Final Test (Lesson 5) - First Completion:**
   - 1 star: 100 XP
   - 2 stars: 150 XP
   - 3 stars: 200 XP

3. **Checkpoint Test:**
   - 500 XP (100 XP × 5 units)
   - Each unit passed gets 1 star

4. **Review (Replay) - Any Lesson:**
   - 50% of first completion XP
   - Example: 3-star final test replay = 100 XP (50% of 200 XP)

**Relationships:**
- `user_id` → `users.id` (CASCADE DELETE)
- `unit_id` → `units.id` (CASCADE DELETE)
- `lesson_id` → `lessons.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`user_id`, `lesson_id`)
- INDEX (`user_id`, `completed_at`)

---

### 7. CHECKPOINTS Table
Stores checkpoint tests that allow skipping units.

**Fields:**
- `id` (VARCHAR(50), PRIMARY KEY): e.g., "checkpoint-1"
- `title` (VARCHAR(100), NOT NULL)
- `subtitle` (VARCHAR(255)): Description of what can be skipped
- `after_unit_id` (INTEGER, FOREIGN KEY → units.id): Appears after this unit
- `unlocked` (BOOLEAN, DEFAULT false): Availability
- `xp_reward` (INTEGER, DEFAULT 500): Fixed 500 XP for passing checkpoint
- `created_at` (TIMESTAMP)

**Relationships:**
- `after_unit_id` → `units.id` (CASCADE)

---

### 8. CHECKPOINT_SKIPS Table
Junction table for checkpoints and units they can skip.

**Fields:**
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `checkpoint_id` (VARCHAR(50), FOREIGN KEY → checkpoints.id, NOT NULL)
- `unit_id` (INTEGER, FOREIGN KEY → units.id, NOT NULL)

**Relationships:**
- `checkpoint_id` → `checkpoints.id` (CASCADE DELETE)
- `unit_id` → `units.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`checkpoint_id`, `unit_id`)

---

### 9. LESSON_GAMES Table
Configures game types for each lesson.

**Fields:**
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `lesson_id` (INTEGER, FOREIGN KEY → lessons.id, NOT NULL)
- `game_type` (ENUM('signal-check', 'galaxy-match', 'planetary-order', 'rescue-mission'), NOT NULL)
- `difficulty` (ENUM('easy', 'medium', 'hard'), DEFAULT 'medium')
- `question_count` (INTEGER, DEFAULT 10)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relationships:**
- `lesson_id` → `lessons.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`lesson_id`)

---

### 10. GAME_SESSIONS Table
Records each game play session.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, NOT NULL)
- `lesson_game_id` (INTEGER, FOREIGN KEY → lesson_games.id, NOT NULL)
- `score` (INTEGER, DEFAULT 0): Points earned
- `correct_count` (INTEGER, DEFAULT 0)
- `total_count` (INTEGER, NOT NULL)
- `time_spent` (INTEGER): Seconds
- `xp_earned` (INTEGER, DEFAULT 0)
- `completed_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

**Relationships:**
- `user_id` → `users.id` (CASCADE DELETE)
- `lesson_game_id` → `lesson_games.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`user_id`, `completed_at`)

---

### 11. GAME_WRONG_ANSWERS Table
Stores incorrect answers for review.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `game_session_id` (UUID, FOREIGN KEY → game_sessions.id, NOT NULL)
- `question_id` (VARCHAR(100)): Identifier for the question
- `prompt` (TEXT): Question text
- `user_answer` (VARCHAR(255)): What user answered
- `correct_answer` (VARCHAR(255)): Right answer
- `created_at` (TIMESTAMP)

**Relationships:**
- `game_session_id` → `game_sessions.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`game_session_id`)

---

### 12. ACHIEVEMENTS Table
Defines available achievements.

**Fields:**
- `id` (VARCHAR(50), PRIMARY KEY): e.g., "first-unit"
- `title` (VARCHAR(100), NOT NULL)
- `description` (TEXT, NOT NULL)
- `target` (INTEGER, NOT NULL): Goal value
- `reward_xp` (INTEGER, NOT NULL): XP reward
- `icon` (VARCHAR(50)): Icon identifier
- `badge` (VARCHAR(50)): Badge emoji
- `medal` (VARCHAR(50)): Medal emoji for completion
- `chain_id` (VARCHAR(50), FOREIGN KEY → achievements.id): Previous achievement required
- `created_at` (TIMESTAMP)

**Relationships:**
- `chain_id` → `achievements.id` (SET NULL) for sequential achievements

**Indexes:**
- PRIMARY KEY (`id`)

---

### 13. USER_ACHIEVEMENTS Table
Tracks user progress on achievements.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, NOT NULL)
- `achievement_id` (VARCHAR(50), FOREIGN KEY → achievements.id, NOT NULL)
- `progress` (INTEGER, DEFAULT 0): Current progress
- `status` (ENUM('locked', 'in-progress', 'completed', 'claimed'), DEFAULT 'locked')
- `unlocked_at` (TIMESTAMP NULL)
- `claimed_at` (TIMESTAMP NULL)

**Relationships:**
- `user_id` → `users.id` (CASCADE DELETE)
- `achievement_id` → `achievements.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`user_id`, `achievement_id`)

---

### 14. DAILY_TASKS Table
Defines daily task templates.

**Fields:**
- `id` (VARCHAR(50), PRIMARY KEY): e.g., "complete-3-lessons"
- `title` (VARCHAR(100), NOT NULL)
- `description` (TEXT, NOT NULL)
- `target` (INTEGER, NOT NULL)
- `reward_xp` (INTEGER, NOT NULL)
- `icon` (VARCHAR(50))
- `task_type` (ENUM('lesson', 'xp', 'streak', 'game'), NOT NULL)
- `week_number` (INTEGER): For weekly rotation
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- PRIMARY KEY (`id`)

---

### 15. USER_DAILY_TASKS Table
Tracks user progress on daily tasks.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, NOT NULL)
- `daily_task_id` (VARCHAR(50), FOREIGN KEY → daily_tasks.id, NOT NULL)
- `progress` (INTEGER, DEFAULT 0)
- `status` (ENUM('locked', 'in-progress', 'completed', 'claimed'), DEFAULT 'in-progress')
- `completed_at` (TIMESTAMP NULL)
- `claimed_at` (TIMESTAMP NULL)
- `week_number` (INTEGER): Week assignment
- `created_at` (TIMESTAMP)

**Relationships:**
- `user_id` → `users.id` (CASCADE DELETE)
- `daily_task_id` → `daily_tasks.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`user_id`, `daily_task_id`, `week_number`)

---

### 16. LEADERBOARD Table
Stores weekly leaderboard rankings.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, NOT NULL)
- `weekly_xp` (INTEGER, DEFAULT 0): XP earned this week
- `rank` (INTEGER): Position in league
- `league_id` (INTEGER, FOREIGN KEY → leagues.id, NOT NULL)
- `week_number` (INTEGER, NOT NULL): ISO week number
- `season` (INTEGER): Season/year
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relationships:**
- `user_id` → `users.id` (CASCADE DELETE)
- `league_id` → `leagues.id` (CASCADE)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`user_id`, `week_number`, `season`)
- INDEX (`league_id`, `weekly_xp` DESC) for leaderboard queries

---

### 17. LEAGUES Table
Defines league tiers for leaderboard.

**Fields:**
- `id` (INTEGER, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(50), NOT NULL): e.g., "Bronze", "Silver", "Gold", "Diamond"
- `color` (VARCHAR(50)): Tailwind gradient class
- `icon` (VARCHAR(10)): Emoji icon
- `min_xp` (INTEGER, NOT NULL): Minimum XP to enter
- `max_xp` (INTEGER): Maximum XP (NULL for highest tier)
- `created_at` (TIMESTAMP)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`name`)

---

### 18. FEEDBACK Table
Stores user feedback and reviews.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, NOT NULL)
- `type` (ENUM('Review', 'Suggestion', 'Bug Report'), NOT NULL)
- `rating` (INTEGER): 1-5 stars (NULL for bug reports)
- `message` (TEXT, NOT NULL)
- `status` (ENUM('unread', 'read', 'resolved'), DEFAULT 'unread')
- `created_at` (TIMESTAMP)
- `resolved_at` (TIMESTAMP NULL)

**Relationships:**
- `user_id` → `users.id` (SET NULL) preserve feedback if user deleted

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`status`, `created_at`)

---

### 19. SUBSCRIPTIONS Table
Manages user subscription plans.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users.id, NOT NULL)
- `type` (ENUM('Free', 'Premium', 'Super'), DEFAULT 'Free')
- `start_date` (DATE, NOT NULL)
- `renewal_date` (DATE): Next billing date
- `status` (ENUM('active', 'canceled', 'expired'), DEFAULT 'active')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relationships:**
- `user_id` → `users.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- UNIQUE KEY (`user_id`)

---

### 20. TRANSACTIONS Table
Records payment transactions.

**Fields:**
- `id` (UUID, PRIMARY KEY)
- `subscription_id` (UUID, FOREIGN KEY → subscriptions.id, NOT NULL)
- `amount` (DECIMAL(10,2), NOT NULL)
- `currency` (VARCHAR(3), DEFAULT 'USD')
- `status` (ENUM('pending', 'completed', 'failed'), DEFAULT 'pending')
- `payment_method` (VARCHAR(50)): e.g., "Credit Card", "PayPal"
- `created_at` (TIMESTAMP)

**Relationships:**
- `subscription_id` → `subscriptions.id` (CASCADE DELETE)

**Indexes:**
- PRIMARY KEY (`id`)
- INDEX (`subscription_id`, `created_at`)

---

## 🔗 Key Relationships Summary

### One-to-One (1:1)
- `users` ↔ `user_progress` (Each user has one progress record)
- `users` ↔ `subscriptions` (Each user has one active subscription)

### One-to-Many (1:N)
- `users` → `lesson_progress` (User completes many lessons)
- `users` → `game_sessions` (User plays many games)
- `users` → `feedback` (User submits many feedback entries)
- `units` → `lessons` (Unit contains many lessons)
- `lessons` → `vocabulary` (Lesson has many vocabulary words)
- `lessons` → `lesson_games` (Lesson can have multiple game configurations)
- `game_sessions` → `game_wrong_answers` (Session records many wrong answers)
- `subscriptions` → `transactions` (Subscription has many payment transactions)

### Many-to-Many (N:M)
- `users` ↔ `achievements` (through `user_achievements`)
- `users` ↔ `daily_tasks` (through `user_daily_tasks`)
- `checkpoints` ↔ `units` (through `checkpoint_skips`)

---

## 📊 Data Volume Estimates

### Expected Scale
- **Users**: 10,000 - 100,000+ users
- **Units**: 12 units (relatively static)
- **Lessons**: ~180 lessons (12 units × 15 lessons)
- **Vocabulary**: ~2,000-5,000 words
- **Game Sessions**: High volume (10-100+ per user)
- **Leaderboard**: Weekly reset, ~100,000 records/year
- **Achievements**: 20-50 achievement definitions
- **Daily Tasks**: 5-10 task templates, rotating weekly

### Storage Considerations
- **High Write Tables**: `game_sessions`, `game_wrong_answers`, `leaderboard`, `user_daily_tasks`
- **High Read Tables**: `vocabulary`, `units`, `lessons`, `leaderboard`
- **Archive Candidates**: Old `game_sessions`, historical `leaderboard` data

---

## 🔐 Security & Privacy

### Sensitive Data
- `users.password_hash`: bcrypt/argon2 encrypted
- `users.email`: PII, requires encryption at rest
- `transactions`: Financial data, requires PCI compliance

### Access Control
- User data: Isolated by `user_id` with Row-Level Security (RLS)
- Admin tables: Restricted to admin role
- Leaderboard: Public read, restricted write

---

## ⚡ Performance Optimization

### Critical Indexes
\`\`\`sql
-- Leaderboard query optimization
CREATE INDEX idx_leaderboard_ranking ON leaderboard(league_id, weekly_xp DESC, week_number);

-- User progress lookup
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id, status);

-- Game session history
CREATE INDEX idx_game_sessions_user_date ON game_sessions(user_id, completed_at DESC);

-- Vocabulary search
CREATE INDEX idx_vocabulary_unit_lesson ON vocabulary(unit_id, lesson_id);
\`\`\`

### Caching Strategy
- **Redis Cache**: Leaderboard rankings, user stats, active leagues
- **CDN**: Images (vocabulary, avatars), audio files
- **Application Cache**: Static content (units, lessons, achievements)

---

## 🔄 Data Lifecycle

### Daily
- Reset `user_daily_tasks` progress at midnight
- Update `streak_days` in `user_progress`
- Archive completed game sessions (>30 days)

### Weekly
- Reset `weekly_xp` in `user_progress` (Monday 00:00)
- Calculate league promotions/demotions
- Rotate `daily_tasks` assignments
- Archive old leaderboard data

### Monthly
- Generate subscription renewal transactions
- Aggregate analytics data
- Cleanup expired sessions

---

## 📝 Notes & Future Enhancements

### Planned Features
1. **Social Features**: Friend system, direct messaging
2. **AI Assistant**: Chat history, conversation persistence
3. **Content Management**: Version control for curriculum
4. **Analytics Dashboard**: Detailed learning insights
5. **Gamification**: Badges, titles, profile customization

### Migration Path
- Version 1.0: Core learning + authentication
- Version 2.0: Gamification + leaderboard (current)
- Version 3.0: Social features + AI assistant
- Version 4.0: Advanced analytics + personalization


**End of Database Schema Documentation**
