# Project Handoff Notes

Updated: 2026-05-22

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
