# Project Handoff Notes

Updated: 2026-06-09

## Project Scan And Branch Merge Update On 2026-06-09

User request:

- Re-scan the project files and update `description.md`.
- Merge current branches into `test` and resolve conflicts.

Git merge result:

- Active branch after work: `test`.
- `git fetch --all --prune` was run before merging.
- `main` was merged into `test` by fast-forward.
- `origin/feature_chatRealtime/GThien` was merged into `test` by fast-forward.
- `T.Anh` was merged into `test` with merge commit `9cdf8b0` (`Merge branch 'T.Anh' into test`).
- `origin/feature_payment/GThien`, `origin/feature_playgame/GThien`, and local `GThien` had no remaining unique changes relative to `test`; they are already ancestors of the final `test` history.
- Conflicts from `T.Anh` were resolved by keeping the newer `test` versions for:
  - `FE/app/client/page.tsx`
  - `FE/app/client/profile/page.tsx`
  - `FE/app/sign-in/page.tsx`
  - `FE/app/sign-up/page.tsx`
  - `backend/package-lock.json`
  - `backend/server.js`
  - `backend/src/config/database.js`
  - `backend/src/services/email.service.js`
- Auto-merged login payload in `backend/src/services/auth.service.js` was restored to the newer full `userResponse` behavior from `test`.
- A runtime avatar upload artifact from `T.Anh` was excluded from the final merge:
  - `backend/uploads/avatars/Screenshot_2024_04_21_235736_1766741369119_3623.png`

Project scan summary:

- Total files found by `rg --files`: 329.
- Frontend app files under `FE/app`: 61.
- Backend source files under `backend/src`: 128.
- Backend tests under `backend/tests`:
  - `checkpoint.service.test.js`
  - `placement.service.test.js`
  - `setup.js`
- Backend migrations now present:
  - `001_complete_schema.sql`
  - `002_add_practice_message_friend_tables.sql`
  - `003_add_missing_columns.sql`
  - `004_add_mission_badge_medal.sql`
  - `005_create_placement_tables.sql`
  - `006_create_checkpoint_tables.sql`

Current frontend surface:

- Next.js app router in `FE/app`.
- Public/auth pages:
  - `/`
  - `/sign-in`
  - `/sign-up`
  - `/reset-password`
- Admin pages:
  - `/admin`
  - `/admin/users`
  - `/admin/users/[id]`
  - `/admin/resources`
  - `/admin/feedback`
  - `/admin/ai-performance`
- Client pages:
  - `/client`
  - `/client/profile`
  - `/client/settings`
  - `/client/units`
  - `/client/units/[unitId]/lessons`
  - `/client/units/[unitId]/lessons/[lessonId]`
  - `/client/units/[unitId]/challenge`
  - `/client/checkpoint/[id]`
  - `/client/placement-test`
  - `/client/practice`
  - `/client/practice/vocabulary`
  - `/client/practice/listen-fill`
  - `/client/practice/listen-repeat`
  - `/client/practice/read-answer`
  - `/client/practice/read-story`
  - `/client/flashcard`
  - `/client/games/galaxy-match`
  - `/client/games/planetary-order`
  - `/client/games/signal-check`
  - `/client/games/rescue-mission`
  - `/client/games/voice-command`
  - `/client/messages`
  - `/client/mission`
  - `/client/leaderboard`
  - `/client/assistant`
  - `/client/feedback`

Current backend surface:

- Express API entrypoint: `backend/src/app.js`.
- Server entrypoint: `backend/server.js`.
- Database config: `backend/src/config/database.js`.
- Realtime: `backend/src/socket/index.js` with Socket.IO direct-message support.
- Route modules:
  - `auth`, `users`, `units`, `lessons`, `vocabulary`
  - `games`, `ai`, `payments`, `admin/payments`
  - `missions`, `leaderboard`, `friends`, `messages`
  - `practice`, `placement`, `checkpoints`
  - admin/content/report/socket support routes
- Sequelize models now include:
  - Core learning: `Unit`, `Lesson`, `Vocabulary`, `LessonProgress`, `UserVocabulary`
  - User/progress: `User`, `UserProgress`, `UserMission`, `Mission`
  - Games: `GameConfig`, `LessonGame`, `GameSession`, `GameWrongAnswer`
  - Practice: `PracticeTopic`, `PracticeItem`, `PracticeAttempt`, `PracticeProgress`
  - Social/chat: `Friendship`, `DirectMessage`, `Conversation`, `ConversationMessage`
  - Payment/admin: `PaymentOrder`, `Feedback`
  - Placement/checkpoint/challenge: `PlacementTopic`, `PlacementTestSession`, `UnitTestConfig`, `UnitTestSession`, `QuestionCheckpoint`, `QuestionChallenge`

Newer merged backend modules to be aware of:

- Placement test API:
  - `GET /api/placement/topics?age=12`
  - `POST /api/placement/generate`
  - `POST /api/placement/:sessionId/submit`
  - `GET /api/placement/:sessionId/result`
  - `GET /api/placement/history`
- Checkpoint API:
  - `GET /api/checkpoints`
  - `GET /api/checkpoints/:id`
  - `GET /api/checkpoints/:id/questions`
  - `POST /api/checkpoints/:id/start`
  - `POST /api/checkpoints/:id/submit`
  - `GET /api/checkpoints/:id/result/:sessionId`
  - `GET /api/checkpoints/history`
- Friend request API now includes pending-request flow in addition to add/remove friend behavior:
  - `GET /api/friends/requests`
  - `POST /api/friends/:userId/accept`
  - `POST /api/friends/:userId/reject`
  - `DELETE /api/friends/requests/:userId`

Seeder and test notes:

- `backend/src/seeders/index.js` was updated after the merge scan so the full seeder also clears and runs placement/checkpoint seed data:
  - `13-placement-topics.seed.js`
  - `14-checkpoint-configs.seed.js`
  - `15-checkpoint-questions.seed.js`
- Backend Jest config exists at `backend/jest.config.js`.
- Backend test command:
  - `cd backend`
  - `npm test`
- Syntax check performed after the seeder update:
  - `node --check backend/src/seeders/index.js`
- Frontend TypeScript check performed after merge cleanup:
  - `cd FE`
  - `npx tsc --noEmit`
  - Result: passed.
- Web Speech API types were centralized in `FE/types/speech-recognition.d.ts` to avoid duplicate `SpeechRecognition` declarations between listen-repeat and unit challenge pages.
- Backend dependencies were installed locally so Jest is available in `backend/node_modules`.
- Backend Jest command reached the test suites but could not pass in this local environment because MySQL rejected the configured test connection:
  - `SequelizeAccessDeniedError`
  - `Access denied for user 'root'@'localhost' (using password: NO)`
- `npm install` reported existing dependency audit issues:
  - 18 vulnerabilities total
  - 9 moderate
  - 9 high
  - No `npm audit fix` was run because it may change dependency versions beyond this merge task.

Important runtime notes:

- Backend still requires a working MySQL connection and correct `backend/.env`.
- Frontend expects JWT in `localStorage` under `token`.
- `NEXT_PUBLIC_API_URL` can be used by connected frontend pages; many pages still contain direct `fetch` calls, so API base URL handling is not fully centralized.
- Do not push automatically; this repo's workflow remains local-first unless the user explicitly requests `git push`.

## Practice Modes API Work Completed On 2026-05-24

User request:

- Build a shared backend practice module for:
  - `listen-fill`
  - `listen-repeat`
  - `read-answer`
  - `read-story`
- Remove hardcoded topic/content loading from the current FE practice pages.
- Seed initial practice content from the current FE mock data.
- Save user progress, completed/total counts, attempts, XP, study minutes, and daily-goal mission progress.
- Keep the existing UI layout, visual style, modals, buttons, and interaction flow as much as possible.

Backend changes:

- New models:
  - `backend/src/models/PracticeTopic.js`
  - `backend/src/models/PracticeItem.js`
  - `backend/src/models/PracticeAttempt.js`
  - `backend/src/models/PracticeProgress.js`
- New practice API files:
  - `backend/src/services/practice.service.js`
  - `backend/src/controllers/practice.controller.js`
  - `backend/src/routes/practice.routes.js`
  - `backend/src/validators/practice.validator.js`
  - `backend/src/seeders/05-practice.seed.js`
- Updated:
  - `backend/src/models/User.js`
    - Added practice attempt/progress associations.
  - `backend/src/routes/index.js`
    - Registered `/api/practice`.
    - Added practice endpoints to API documentation JSON.
  - `backend/src/seeders/index.js`
    - Includes `05-practice.seed.js`.

Practice endpoints added:

- `GET /api/practice/modes`
- `GET /api/practice/:mode/topics`
- `GET /api/practice/:mode/topics/:slug`
- `POST /api/practice/:mode/topics/:slug/start`
- `POST /api/practice/attempts/:attemptId/complete`

Practice completion behavior:

- Score is calculated from `correctCount / totalCount`.
- XP rules:
  - score >= 90: 120 XP
  - score >= 70: 80 XP
  - score >= 50: 40 XP
  - score < 50: 10 XP
- Completing an already completed topic awards review XP at 50%.
- Completion updates:
  - `practice_attempts`
  - `practice_progress`
  - `user_progress.total_xp`
  - `user_progress.weekly_xp`
  - `user_progress.xp_this_week`
  - `user_progress.total_study_minutes`
  - daily-goal mission progress by elapsed study minutes

Frontend changes:

- New shared practice API helper:
  - `FE/lib/api/practice.ts`
    - Normalizes `NEXT_PUBLIC_API_URL` whether it includes `/api` or not.
    - Reads token from `localStorage.getItem("token")`.
    - Provides topic/detail/start/complete helpers.
- New shared UI helpers:
  - `FE/components/practice-topic-list.tsx`
  - `FE/components/practice-detail-state.tsx`
- Updated list pages to load backend topic cards and progress:
  - `FE/app/client/practice/listen-fill/page.tsx`
  - `FE/app/client/practice/listen-repeat/page.tsx`
  - `FE/app/client/practice/read-answer/page.tsx`
  - `FE/app/client/practice/read-story/page.tsx`
- Updated detail pages to load backend content and complete attempts:
  - `FE/app/client/practice/listen-fill/[id]/page.tsx`
  - `FE/app/client/practice/listen-repeat/[id]/page.tsx`
  - `FE/app/client/practice/read-answer/[id]/page.tsx`
  - `FE/app/client/practice/read-story/[id]/page.tsx`
- Fixed browser speech-recognition TypeScript declarations in `listen-repeat/[id]`.

Practice verification performed:

- Backend syntax checks passed:
  - `backend/src/models/PracticeTopic.js`
  - `backend/src/models/PracticeItem.js`
  - `backend/src/models/PracticeAttempt.js`
  - `backend/src/models/PracticeProgress.js`
  - `backend/src/services/practice.service.js`
  - `backend/src/controllers/practice.controller.js`
  - `backend/src/routes/practice.routes.js`
  - `backend/src/validators/practice.validator.js`
  - `backend/src/seeders/05-practice.seed.js`
  - `backend/src/models/User.js`
  - `backend/src/routes/index.js`
  - `backend/src/seeders/index.js`
- Frontend type check passed:
  - `cd FE`
  - `npx tsc --noEmit`
- Model auto-import check passed for:
  - `PracticeTopic`
  - `PracticeItem`
  - `PracticeAttempt`
  - `PracticeProgress`

Runtime notes:

- The practice tables are created by Sequelize sync in development when `DB_SYNC` is not `false`.
- Run the full seeder from `backend/src/seeders/index.js` or run `backend/src/seeders/05-practice.seed.js` directly after the tables exist.
- API endpoint testing still requires a valid JWT token from sign-in and a working local MySQL connection.

## Messages / Realtime Chat Work Completed On 2026-05-23

User request:

- Keep the current Messages UI as much as possible.
- Connect API for user search.
- Connect realtime chat:
  - text messages
  - image messages with downloadable images
  - voice messages
- Keep system notifications as mock data for now.
- Create an ignored `addusers` file to seed 5 sample users with different XP/progress values.
- Add sample account login info and seeder instructions to this file.

Frontend changes:

- File: `FE/app/client/messages/page.tsx`
  - Keeps the existing tabs, panels, search area, friend profile modal, and chat layout.
  - Chat tab now starts from real backend data instead of friend/message mock data:
    - friend list count and rows come from `GET /api/friends`
    - selected friend opens real conversation history from `GET /api/messages/:friendId`
    - new messages are appended from Socket.IO `direct:message`
  - Search bar now calls backend user search after the user enters at least 2 characters.
  - Search results still open the existing user profile modal and use the same Add Friend / Remove Friend actions.
  - Friend list rows display backend-provided:
    - display name
    - avatar
    - last message
    - last message time
    - unread count
    - online/offline signal when Socket.IO emits presence events
  - Notifications still use the existing mock data.
  - Loads friend list from:
    - `GET /api/friends`
  - Loads conversation history from:
    - `GET /api/messages/:friendId`
  - Searches users from:
    - `GET /api/users/search?q=keyword`
  - Adds/removes friends through existing endpoints:
    - `POST /api/friends/:userId`
    - `DELETE /api/friends/:userId`
  - Connects Socket.IO client to the backend and listens/sends:
    - `direct:message`
    - `direct:user_online`
    - `direct:user_offline`
  - Sends images by uploading to:
    - `POST /api/messages/media`
  - Sends voice messages with browser `MediaRecorder`, uploads the audio blob to:
    - `POST /api/messages/media`
  - Renders received voice messages with an audio player.
  - Renders image messages with a `Download image` action backed by:
    - `GET /api/messages/media/download/:filename`
  - Added `socket.io-client` dependency to `FE/package.json`.

- File: `FE/package.json`
- File: `FE/package-lock.json`
  - Added frontend dependency:
    - `socket.io-client`

Backend changes:

- New backend files added for direct chat:
  - `backend/src/models/DirectMessage.js`
  - `backend/src/services/message.service.js`
  - `backend/src/controllers/message.controller.js`
  - `backend/src/routes/message.routes.js`

- File: `backend/src/models/DirectMessage.js`
  - Added `direct_messages` table model:
    - `sender_id`
    - `receiver_id`
    - `type`: `text | image | voice`
    - `content`
    - `media_url`
    - `voice_duration`
    - `read_at`
    - `created_at`

- File: `backend/src/services/message.service.js`
  - Added direct-chat validation, message serialization, message history, unread counts, and message creation.
  - Direct chat is allowed only between accepted friends.

- File: `backend/src/controllers/message.controller.js`
- File: `backend/src/routes/message.routes.js`
  - Added private message endpoints:
    - `POST /api/messages/media`
    - `GET /api/messages/media/download/:filename`
    - `GET /api/messages/:friendId`
    - `POST /api/messages/:friendId`

- File: `backend/src/socket/index.js`
  - Users now join their own `user:<id>` Socket.IO room.
  - Socket.IO CORS now allows both `http://localhost:3000` and `http://localhost:3001` by default, or custom comma-separated origins from `CLIENT_URL`.
  - Added direct-message realtime events:
    - `direct:message`
    - `direct:typing_start`
    - `direct:typing_stop`
    - `direct:user_online`
    - `direct:user_offline`

- File: `backend/src/services/user.service.js`
- File: `backend/src/controllers/user.controller.js`
- File: `backend/src/routes/user.routes.js`
  - Added private user search:
    - `GET /api/users/search?q=keyword`

- File: `backend/src/services/friend.service.js`
- File: `backend/src/controllers/friend.controller.js`
- File: `backend/src/routes/friend.routes.js`
  - Added private friend list:
    - `GET /api/friends`
  - Friend rows include last message, unread count, XP, and league fields used by the current UI.

- File: `backend/src/middlewares/upload.middleware.js`
  - Added chat media upload support for image/audio files.
  - Chat files are stored in:
    - `backend/uploads/chat`

- File: `backend/src/routes/index.js`
  - Registered `/api/messages`.
  - API documentation JSON now lists message endpoints and user search/friend list endpoints.

Commits pushed to `origin/main`:

- `812ca07 feat: connect realtime chat and user search`
  - realtime chat, user search, friend list display, direct-message backend, chat media upload/download, and Socket.IO client
- `a7b930a chore: add sample user seeder notes`
  - `addusers.js`, `.gitignore`, and `description.md` seed/handoff notes

Seeder file:

- File: `addusers.js`
  - Added root script that creates/updates 5 sample users and their `user_progress`.
  - Adds a few friendships among sample accounts so chat can be tested immediately after logging into those sample accounts.
  - Added `addusers.js` to `.gitignore`.

How to run the sample-user seeder:

- Make sure MySQL is running and `backend/.env` has the correct database credentials.
- From the project root, run:
  - `node addusers.js`
- The script is safe to rerun; it updates the same sample accounts by email.

Sample accounts created by `addusers.js`:

| Display name | Username | Email | Password |
| --- | --- | --- | --- |
| Cosmos Arya | `cosmos_arya` | `cosmos.arya@test.local` | `User123` |
| Nebula Minh | `nebula_minh` | `nebula.minh@test.local` | `User123` |
| Orbit Linh | `orbit_linh` | `orbit.linh@test.local` | `User123` |
| Stellar Khoa | `stellar_khoa` | `stellar.khoa@test.local` | `User123` |
| Lunar Trang | `lunar_trang` | `lunar.trang@test.local` | `User123` |

Messages verification performed:

- Backend syntax checks passed:
  - `node --check backend/src/models/DirectMessage.js`
  - `node --check backend/src/services/message.service.js`
  - `node --check backend/src/controllers/message.controller.js`
  - `node --check backend/src/routes/message.routes.js`
  - `node --check backend/src/services/user.service.js`
  - `node --check backend/src/services/friend.service.js`
  - `node --check backend/src/socket/index.js`
  - `node --check addusers.js`
- Frontend type check passed:
  - `cd FE`
  - `npx tsc --noEmit`
- `npm install socket.io-client` needed `--legacy-peer-deps` because the existing `vaul@0.9.9` dependency declares an older React peer range.
- Running `node addusers.js` was blocked by local MySQL credentials:
  - `SequelizeAccessDeniedError`
  - `Access denied for user 'root'@'localhost' (using password: NO)`
  - Fix `backend/.env` database credentials and rerun `node addusers.js`.

Follow-up verification on 2026-05-24:

- Backend syntax checks still passed for the message/search/friend/socket/seeder files:
  - `backend/src/models/DirectMessage.js`
  - `backend/src/services/message.service.js`
  - `backend/src/controllers/message.controller.js`
  - `backend/src/routes/message.routes.js`
  - `backend/src/services/friend.service.js`
  - `backend/src/services/user.service.js`
  - `backend/src/socket/index.js`
  - `backend/src/routes/index.js`
  - `addusers.js`
- Frontend project type check currently fails in an unrelated practice page:
  - `FE/app/client/practice/listen-repeat/[id]/page.tsx`
  - Missing browser speech-recognition typings for `SpeechRecognition`
  - One implicit `any` parameter on a speech-recognition event handler
  - Message page changes were not the source of this failure.

## Practice Vocabulary API Work Completed On 2026-05-22

User request:

- Connect `client/practice/vocabulary` to API so the page loads learned vocabulary instead of mock data.

Frontend changes:

- File: `FE/app/client/practice/vocabulary/page.tsx`
  - Removed mock vocabulary data.
  - Loads learned words from:
    - `GET /api/vocabulary/learned`
  - Loads favorite words from:
    - `GET /api/vocabulary/favorites`
  - Keeps the existing Known Words / Favorite Words tabs, search, unit filter, sort, pronounce, and Start Review UI.
  - Favorite star now calls backend:
    - `POST /api/vocabulary/:id/favorite`
    - `DELETE /api/vocabulary/:id/favorite`
  - Shows loading, missing-token/sign-in, and API error states.
  - Normalizes `NEXT_PUBLIC_API_URL` when it is configured as either `http://localhost:5000` or `http://localhost:5000/api`.

Backend changes:

- File: `backend/src/services/vocabulary.service.js`
  - Added `getLearnedVocabulary(userId)`, returning rows from `user_vocabulary` joined with `vocabulary`, `unit`, and `lesson`.

- File: `backend/src/controllers/vocabulary.controller.js`
  - Added `getLearnedVocabulary`.

- File: `backend/src/routes/vocabulary.routes.js`
  - Added private endpoint:
    - `GET /api/vocabulary/learned`
  - Route is placed before `GET /api/vocabulary/:id` so `learned` is not treated as an ID.

- File: `backend/src/routes/index.js`
  - API documentation JSON now lists:
    - `GET /api/vocabulary/learned`

Practice vocabulary verification performed:

- Backend syntax checks passed:
  - `node --check backend/src/services/vocabulary.service.js`
  - `node --check backend/src/controllers/vocabulary.controller.js`
  - `node --check backend/src/routes/vocabulary.routes.js`
  - `node --check backend/src/routes/index.js`
- Frontend type check passed:
  - `cd FE`
  - `npx tsc --noEmit`
- Frontend dev server verification:
  - `GET http://localhost:3001/client/practice/vocabulary` returned `200`

## Leaderboard UI / API Work Completed On 2026-05-22

User request:

- Read this project handoff file first.
- Update the client leaderboard UI to match the new design:
  - replace the heart action with a user profile popup
  - show Add Friend when the selected user is not a friend
  - show Delete Friend with a confirmation popup when the selected user is already a friend
  - keep the league rule: users compete inside the same league by weekly XP; top 5 promote and bottom 3 demote on weekly reset
- Connect the UI to backend data and add missing backend data.
- Update this handoff file.

Frontend changes:

- File: `FE/app/client/leaderboard/page.tsx`
  - Replaced local heart/like state with a profile popup opened from the row action button.
  - Loads all leaderboard data from:
    - `GET /api/leaderboard/full?limit=50`
  - Uses normalized API base URL handling, so `NEXT_PUBLIC_API_URL` may be either `http://localhost:5000` or `http://localhost:5000/api`.
  - Displays:
    - last week's top 3
    - current league badge
    - current user's rank inside the league
    - weekly XP
    - total XP in the profile popup
    - best/current league rank in the profile popup
    - friend/self status in leaderboard rows
  - Adds friend through:
    - `POST /api/friends/:userId`
  - Removes friend through:
    - `DELETE /api/friends/:userId`
  - Delete friend flow now shows an `AlertDialog` confirmation before calling the backend.
  - Missing/expired token shows the sign-in action at `/sign-in`.

Backend changes:

- File: `backend/src/models/Friendship.js`
  - Added `friendships` table model:
    - `requester_id`
    - `addressee_id`
    - `status`: `pending | accepted` (currently created as `accepted` for the leaderboard Add Friend flow)
    - timestamps

- File: `backend/src/services/friend.service.js`
  - Added add/remove friend logic.
  - Prevents adding yourself.
  - Reuses an existing friendship row in either direction instead of creating a duplicate relationship.

- File: `backend/src/controllers/friend.controller.js`
- File: `backend/src/routes/friend.routes.js`
  - Added private friend endpoints:
    - `POST /api/friends/:userId`
    - `DELETE /api/friends/:userId`

- File: `backend/src/models/User.js`
  - Added associations for sent and received friendships.

- File: `backend/src/services/leaderboard.service.js`
  - Reworked weekly league leaderboard to use `user_progress` data for users in the same league.
  - Leaderboard order is:
    - `xp_this_week` descending
    - `weekly_xp` descending
    - `total_xp` descending
  - Adds missing frontend fields:
    - `totalXP`
    - `highestRank`
    - `highestPosition`
    - `friendStatus`: `self | none | friends | pending_sent | pending_received`
  - `getFullLeaderboardData()` now returns:
    - `weeklyLeaderboard`
    - `userRank`
    - `topThreeLastWeek`
    - `currentUser`
    - `currentLeague`
    - `promotionCount`
    - `demotionCount`
    - `rankingRule`

- File: `backend/src/controllers/leaderboard.controller.js`
  - Passes the current authenticated user into leaderboard service calls so friend status and same-league ranking can be calculated.

- File: `backend/src/services/user.service.js`
  - `addXP()` now updates both `weekly_xp` and `xp_this_week`.
  - `resetWeeklyXP()` now resets both `weekly_xp` and `xp_this_week`.

- File: `backend/src/routes/index.js`
  - Registered `/api/friends`.
  - API documentation JSON now lists friend endpoints.

Leaderboard endpoints currently relevant:

- `GET /api/leaderboard/full?limit=50`
- `GET /api/leaderboard`
- `GET /api/leaderboard/me`
- `GET /api/leaderboard/top-three`
- `POST /api/friends/:userId`
- `DELETE /api/friends/:userId`

Leaderboard verification performed:

- Backend syntax checks passed:
  - `node --check backend/src/services/leaderboard.service.js`
  - `node --check backend/src/services/friend.service.js`
  - `node --check backend/src/controllers/friend.controller.js`
  - `node --check backend/src/controllers/leaderboard.controller.js`
  - `node --check backend/src/routes/friend.routes.js`
  - `node --check backend/src/routes/index.js`
  - `node --check backend/src/models/Friendship.js`
  - `node --check backend/src/models/User.js`
  - `node --check backend/src/services/user.service.js`
- Frontend type check passed:
  - `cd FE`
  - `npx tsc --noEmit`
- Frontend dev server verification:
  - Started Next.js on `http://localhost:3001`
  - `GET /client/leaderboard` returned `200`

Important runtime notes:

- The new `friendships` table is created by Sequelize sync in development when `DB_SYNC` is not `false`.
- The Add Friend button currently creates an accepted friendship directly. There is no separate friend-request inbox/accept flow connected to backend yet.
- Historical `highestRank` / `highestPosition` storage does not exist yet, so the leaderboard API currently reports the user's current league and current position within the returned league ranking as the popup's best-rank fields.
- Backend runtime verification on `PORT=5001` was blocked by local MySQL credentials:
  - `SequelizeAccessDeniedError`
  - `Access denied for user 'root'@'localhost' (using password: NO)`
  - Fix `backend/.env` database credentials before end-to-end API testing.

## Mission UI / API Work Completed On 2026-05-22

User request:

- Restore the original Mission UI.
- Check mission-related API calls and add missing calls.
- Update this handoff file.
- Merge the current `test` branch into `main`.

Frontend changes:

- File: `FE/app/client/mission/page.tsx`
  - Restored the original daily mission / achievement UI layout:
    - `Daily Missions` and `Achievements` tabs
    - streak counter
    - daily progress bar
    - mission cards with rewards, claim/unlock buttons, locked states, and completed medals
  - Replaced hardcoded mission data with real API calls:
    - `GET /api/missions?type=daily`
    - `GET /api/missions?type=achievement`
    - `GET /api/users/progress`
    - `POST /api/missions/:missionId/claim`
  - Normalizes mission status values from backend (`in_progress` -> `in-progress`).
  - Refreshes mission data after claiming a reward so XP/progress stays synced.
  - Handles missing token by showing a sign-in action.

- File: `FE/app/client/flashcard/page.tsx`
  - Calls mission progress API when a flashcard session is completed:
    - `POST /api/missions/progress` with `missionCode: "flashcard"`
    - `POST /api/missions/progress` with `missionCode: "daily-goal"` and elapsed study minutes
  - Fixed flashcard back/complete navigation to return to `/client/practice`.

Backend changes:

- File: `backend/src/services/game.service.js`
  - Completing a game now updates learning and mission progress:
    - adds study minutes toward `daily-goal`
    - marks the lesson complete when the game is passed
    - increments `lessons_completed` and mission `new-lesson` for first-time lesson completion
    - increments `units_completed` and mission `new-level` when a unit becomes complete

- File: `backend/src/services/lesson.service.js`
  - Completing a lesson through the lesson API now updates:
    - total study minutes
    - `daily-goal`
    - first-time `new-lesson`
    - first-time unit completion and `new-level`

- File: `backend/src/services/vocabulary.service.js`
  - First-time vocabulary progress now increments `user_progress.words_learned`, which feeds the vocabulary achievement chain.

Mission endpoints currently available:

- `GET /api/missions`
- `GET /api/missions?type=daily`
- `GET /api/missions?type=achievement`
- `POST /api/missions/progress`
- `POST /api/missions/:missionId/claim`
- `POST /api/missions/seed`

Runtime notes:

- Frontend still expects the JWT token in `localStorage` under `token`.
- `NEXT_PUBLIC_API_URL` may be either `http://localhost:5000` or `http://localhost:5000/api`; the updated mission/flashcard pages normalize both forms.
- Mission achievement progress is computed from `user_progress`, so game/lesson/vocabulary completion must keep those counters updated.

## Repository

- Project: English Learning Web Game DA1
- Root: `d:\Documents\UIT1\3. DA\English-Learning-Web-Game-DA1-`
- Remote: `https://github.com/thiengl2015/English-Learning-Web-Game-DA1-.git`
- Main frontend: `FE` (Next.js 15, React 19, Tailwind, shadcn-style UI components)
- Main backend: `backend` (Express, Sequelize, MySQL, JWT auth)

## Git Workflow Rule

- Do not automatically push changes to the remote repository.
- When asked to save work, create a local commit only unless the user explicitly requests `git push`.
- Mention the commit hash after committing so the user can decide when to push.

## Git / Branch State Observed

- Current state as of 2026-05-13 after payment commit:
  - Active branch: `test`
  - Tracking: `origin/test`
  - Local branch is `ahead 1`.
  - Latest local commit:
    - `5a14f84 feat: connect profile payment flow`
  - This commit contains the payment/profile files only and was intentionally **not pushed**.
  - Remaining uncommitted changes not included in the payment commit:
    - `FE/app/layout.tsx`
    - `README.md`
    - `backend/uploads/avatars/unnamed_1778586667740_7775.png` (untracked)
  - `description.md` is ignored by git, so updates to this file will not appear in `git status`.
- Work started from local `main`, tracking `origin/main`.
- `git fetch --all --prune` was run.
- Remote branches currently visible:
  - `origin/main` at `2c85f96` (`feat: game4 voice command (UI + logic + type dataset`)
  - `origin/T.Anh` at `9e85778` (`feat: API profile`)
  - `origin/feature_chatRealtime/GThien` at `f79dcc2`
  - `origin/feature_payment/GThien` at `c17a4ec`
  - `origin/feature_playgame/GThien` at `9257a33`
- Remote branches pruned because they were deleted on GitHub:
  - `origin/GT1`
  - `origin/GT2`
  - `origin/GT3`
  - `origin/GThien`
- No remote `test` branch existed at fetch time.
- A new local branch `test` was created from `origin/main`.
- Important: before this work, `FE/app/layout.tsx` already had a local uncommitted change adding `metadata.icons`. That change was preserved and not reverted.
- `origin/T.Anh` contains profile API work, but its diff against `origin/main` is very broad and removes newer main features such as voice-command game files. Because of that, it was not merged wholesale.

## Backend APIs Relevant To Profile

All routes below require `Authorization: Bearer <token>` from `localStorage.getItem("token")`.

- `GET /api/users/profile`
  - Returns current user without password/reset fields and includes `progress`.
- `PUT /api/users/profile`
  - Body fields accepted by validator:
    - `username`
    - `email`
    - `display_name`
    - `native_language`
    - `current_level`: `beginner | intermediate | advanced`
    - `learning_goal`: `travel | work | ielts | toeic | daily | academic`
    - `daily_goal`: integer 5-180
- `POST /api/users/avatar`
  - Multipart form field name: `avatar`
  - Returns `avatar_url`.
- `PUT /api/users/change-password`
  - Body:
    - `currentPassword`
    - `newPassword`
    - `confirmPassword`
  - New password validator requires at least 6 chars, one lowercase, one uppercase, and one number.

## Work Completed In This Session

- Created local branch `test` from the latest `origin/main`.
- Updated `FE/app/client/profile/page.tsx` to connect the profile UI to backend APIs:
  - Loads profile from `GET /api/users/profile`.
  - Redirects to `/sign-in` when token is missing.
  - Saves profile fields through `PUT /api/users/profile`.
  - Changes password through `PUT /api/users/change-password` using the backend's exact field names.
  - Uploads avatar through `POST /api/users/avatar` with `multipart/form-data`.
  - Resolves backend avatar paths against `NEXT_PUBLIC_API_URL` or `http://localhost:5000`.
  - Shows inline success/error notices.
  - Original note: subscription/payment UI was initially left mostly as local simulated state while using real `subscription`/`role`.
  - Later 2026-05-13 work connected this payment UI to backend payment APIs; see the payment section below.
- Added this `description.md` handoff file.
- Added `description.md` to root `.gitignore`.

## Payment/Profile API Work Completed On 2026-05-13

User request:

- In `client/profile`, user can choose renew/cancel subscription.
- User chooses number of paid months.
- System shows a QR code.
- When payment is received:
  - Show success notification.
  - Update transaction history.
  - Store/display transaction code, account premium expiry, amount, and status (`completed`, `pending`, `canceled`).
  - Send payment success email to the user.
  - Print payment success info in backend terminal.

Frontend changes:

- File: `FE/app/client/profile/page.tsx`
- Replaced mock transaction history with real calls to payment API.
- Loads payment history from:
  - `GET /api/payments/orders?limit=20`
- Creates a payment order from the selected month count through:
  - `POST /api/payments/orders`
  - Body: `{ "months": <number> }`
- Displays backend-generated QR from `qr_image_base64`.
- Displays bank transfer details returned by backend:
  - amount
  - transfer content/note
  - bank name/account number when configured
- Polls order status through:
  - `GET /api/payments/orders/:id`
- For local/dev demo, profile page simulates payment receipt after about 10 seconds by calling:
  - `POST /api/payments/orders/:id/complete`
  - This marks the order completed, refreshes profile/payment history, and shows success UI.
- Cancel pending QR/order uses:
  - `PUT /api/payments/orders/:id/cancel`
- Cancel subscription renewal uses:
  - `PUT /api/payments/subscription/cancel`
- Resume subscription renewal uses:
  - `PUT /api/payments/subscription/resume`
- Transaction history table now displays:
  - transaction ID
  - payment date
  - premium expiry
  - amount
  - status (`completed`, `pending`, `canceled`)

Backend changes:

- File: `backend/src/routes/payment.routes.js`
  - Added `authMiddleware` for private user payment routes.
  - Kept packages route public:
    - `GET /api/payments/packages`
  - Added public SePay webhook endpoint:
    - `POST /api/payments/webhook/sepay`
  - Added local/dev completion endpoint:
    - `POST /api/payments/orders/:id/complete`
  - Added subscription renewal endpoints:
    - `PUT /api/payments/subscription/cancel`
    - `PUT /api/payments/subscription/resume`

- File: `backend/src/controllers/payment.controller.js`
  - Rewritten/updated controller methods for:
    - create order by package or month count
    - get user orders
    - get order status
    - cancel pending order
    - complete order
    - cancel/resume subscription renewal
    - SePay webhook

- File: `backend/src/services/payment.service.js`
  - Reworked user payment service.
  - Supports month-based Premium purchase using `PREMIUM_MONTHLY_PRICE || 99000`.
  - Creates pending `PaymentOrder` records and backend QR images.
  - Completes orders by:
    - marking internal status `approved`
    - returning API status as `completed`
    - setting `trans_id`
    - setting `transfer_amount`, `transfer_type`, `transfer_date`
    - calculating `premium_expires_at`
    - updating user `subscription` to `Premium`
    - clearing `subscription_cancelled_at`
    - logging success to backend terminal
    - sending payment success email
  - Maps statuses for the client:
    - DB `approved` -> API `completed`
    - DB `cancelled`/`rejected` -> API `canceled`
    - DB `pending` -> API `pending`
  - `completeOrderFromWebhook()` tries to match SePay transfer note/content against `payment_orders.description` or `id`.
  - Webhook rejects underpaid transfer amounts when an amount is provided.

- File: `backend/src/services/email.service.js`
  - Added `sendPaymentSuccessEmail(email, username, payment)`.
  - Email includes transaction ID, payment amount, and Premium expiry.

- File: `backend/src/services/admin-payment.service.js`
  - Admin approval path now also:
    - calculates and stores `premium_expires_at`
    - updates user Premium expiry
    - clears subscription cancellation flag
    - sends payment success email
    - logs payment success to backend terminal

- File: `backend/src/models/User.js`
  - Added fields:
    - `premium_expires_at`
    - `subscription_cancelled_at`

- File: `backend/src/models/PaymentOrder.js`
  - Added fields:
    - `duration_months`
    - `premium_expires_at`

- File: `backend/server.js`
  - Development schema checker now adds missing columns:
    - `users.premium_expires_at`
    - `users.subscription_cancelled_at`
    - `payment_orders.duration_months`
    - `payment_orders.premium_expires_at`

- File: `backend/src/routes/index.js`
  - API documentation JSON updated with new payment endpoints.

Payment endpoints summary:

- Public:
  - `GET /api/payments/packages`
  - `POST /api/payments/webhook/sepay`
- Private, requires `Authorization: Bearer <token>`:
  - `POST /api/payments/orders`
  - `GET /api/payments/orders`
  - `GET /api/payments/orders/:id`
  - `PUT /api/payments/orders/:id/cancel`
  - `POST /api/payments/orders/:id/complete`
  - `PUT /api/payments/subscription/cancel`
  - `PUT /api/payments/subscription/resume`

Payment verification performed:

- Backend syntax checks passed:
  - `node --check backend/src/services/payment.service.js`
  - `node --check backend/src/controllers/payment.controller.js`
  - `node --check backend/src/routes/payment.routes.js`
  - `node --check backend/src/routes/index.js`
  - related backend payment/email/admin files also checked earlier.
- Frontend type check passed:
  - `cd FE`
  - `npx tsc --noEmit`
- Backend was started temporarily on port `5001` because port `5000` was already occupied.
  - `GET http://localhost:5001/health` returned success.

Important runtime notes:

- Port `5000` was already occupied by another backend/node process during verification, causing repeated `EADDRINUSE` messages in existing `backend-dev.err.log`.
- Do not kill unknown existing node processes unless explicitly requested.
- To test the newest backend code without touching port `5000`, use:
  - PowerShell: set `$env:PORT='5001'` then run `node server.js` in `backend`.
- The local profile payment UI intentionally simulates payment receipt by calling `/api/payments/orders/:id/complete` after about 10 seconds so the demo flow works without real bank webhook setup.
- For real SePay integration, configure SePay callback to:
  - `POST /api/payments/webhook/sepay`
- Payment success terminal log format includes:
  - `[Payment] completed order=... transaction=... user=... amount=... premium_until=...`

## Run Commands

- Frontend:
  - `cd FE`
  - `npm run dev`
  - Default URL: `http://localhost:3000`
- Backend:
  - `cd backend`
  - `npm start`
  - Default URL: `http://localhost:5000`
- Backend health check:
  - `GET http://localhost:5000/health`

## Notes For Next Session

- The backend must be running and connected to MySQL for real profile API testing.
- Frontend expects a JWT token in browser localStorage under key `token`; sign in first through `/sign-in`.
- Consider consolidating repeated API base URL logic into a shared FE helper later. Current project has several pages calling `fetch` directly.
- Some existing source files contain mojibake text from earlier encoding issues. Avoid broad encoding cleanup unless explicitly requested.
- 2026-05-12 backend startup fix: MySQL accepted `root` with an empty password on this machine, while `backend/.env` previously had `DB_PASSWORD` set and caused `SequelizeAccessDeniedError`. Local `.env` was updated to `DB_PASSWORD=` and `EnglishLearningApp` was created if missing. `GET http://localhost:5000/health` returned success afterward.

## Account test
annhannh331@gmail.com
User123
thuyanhtruong316@gmail.com
