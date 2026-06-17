# English-Learning-Web-Game-DA1-

Web game học tiếng Anh theo hướng gamification, có frontend Next.js, backend Express/MySQL và các tính năng AI hỗ trợ luyện tập. Người học có thể học theo unit/lesson, chơi mini-game, luyện từ vựng/ngữ pháp, làm placement/checkpoint/challenge, chat với trợ lý AI, gửi bài viết/ảnh để OCR và chấm sửa, nhắn tin bạn bè, theo dõi nhiệm vụ, bảng xếp hạng và thanh toán Premium.

## Tổng Quan

- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS, Radix/shadcn-style components.
- Backend: Node.js, Express, Sequelize, MySQL, JWT, Socket.IO.
- AI: OpenAI cho assistant, gợi ý học tập và proofread; Gemini là fallback OCR tùy chọn.
- OCR: thư mục `ocr/` chứa pipeline OCR/PDF hybrid cho proofread ảnh/tài liệu.
- Moderation: `moderation-service/` là FastAPI sidecar tùy chọn dùng HuggingFace models để kiểm duyệt chat text/image.
- Media/thanh toán: Cloudinary cho upload tài nguyên admin, SePay QR/webhook cho thanh toán Premium.

## Cấu Trúc Chính

```text
.
├── backend/                 Express API, Sequelize models, routes, services
├── FE/                      Next.js app router frontend
├── moderation-service/      FastAPI service kiểm duyệt nội dung tùy chọn
├── ocr/                     OCR/PDF extraction utilities
├── addusers.js              Script thêm user mẫu và dữ liệu liên quan
├── database.md              DBML cho dbdiagram.io
├── database (1).md          Bản DBML tương đương đang dùng trong IDE
├── database-schema-erd.md   Tài liệu giải thích schema/ERD
└── CONTEXT.md               Ghi chú handoff cho các phiên làm việc tiếp theo
```

## Yêu Cầu

- Node.js 18+; khuyến nghị Node.js 22 vì backend đang dùng `fetch`, `FormData`, `Blob` toàn cục.
- npm 9+.
- MySQL 8+ hoặc MariaDB tương thích.
- Python 3.10-3.12 nếu chạy OCR đầy đủ hoặc moderation sidecar.

## Cấu Hình Backend

Tạo database:

```sql
CREATE DATABASE EnglishLearningApp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Tạo file `backend/.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=EnglishLearningApp

JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

GEMINI_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PREMIUM_MONTHLY_PRICE=99000
SEPAY_BANK_ID=
SEPAY_BANK_CODE=
SEPAY_ACCOUNT_NUMBER=
SEPAY_ACCOUNT_HOLDER=
SEPAY_TRANSFER_PREFIX=EL
SEPAY_API_TOKEN=

EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

MODERATION_ENABLED=false
MODERATION_URL=http://127.0.0.1:8000
MODERATION_TEXT_THRESHOLD=0.5
MODERATION_IMAGE_THRESHOLD=0.7
MODERATION_TIMEOUT_MS=4000
MODERATION_FAIL_OPEN=true
```

Ghi chú: trong development, backend tự `sequelize.sync()` và tự bổ sung một số cột còn thiếu khi khởi động, trừ khi đặt `DB_SYNC=false`.

## Chạy Backend

```bash
cd backend
npm install
npm run dev
```

Backend mặc định chạy tại `http://localhost:5000`.

Kiểm tra nhanh:

```bash
curl http://localhost:5000/health
```

## Chạy Frontend

Tạo file `FE/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Sau đó chạy:

```bash
cd FE
npm install
npm run dev
```

Frontend mặc định chạy tại `http://localhost:3000`.

## Dữ Liệu Mẫu

Seed đầy đủ dữ liệu học tập:

```bash
node backend/src/seeders/index.js
```

Thêm/cập nhật 5 user mẫu phục vụ leaderboard, friends, messages, assistant history và practice progress:

```bash
node addusers.js
```

Tài khoản do `addusers.js` tạo đều dùng mật khẩu:

```text
User123
```

Ví dụ:

```text
cosmos.arya@test.local / User123
nebula.minh@test.local / User123
orbit.linh@test.local / User123
stellar.khoa@test.local / User123
lunar.trang@test.local / User123
```

## Dịch Vụ Tùy Chọn

Moderation sidecar cho chat:

```bash
cd moderation-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8000
```

Bật trong `backend/.env` bằng `MODERATION_ENABLED=true`.

OCR/proofread ảnh dùng API backend `/api/proofread`. Luồng đầy đủ cần Python packages cho OCR và `OPENAI_API_KEY`; Gemini fallback cần `GEMINI_API_KEY`.

## Scripts Hữu Ích

Backend:

```bash
npm start
npm run dev
npm test
node --check <file.js>
```

Frontend:

```bash
npm run dev
npm run build
npm start
npx tsc --noEmit
```

## Tài Liệu Database

- `database.md` và `database (1).md`: DBML để dán vào dbdiagram.io.
- `database-schema-erd.md`: giải thích schema, nhóm bảng và quan hệ.
- Schema hiện có 35 bảng Sequelize model; migration tổng hợp còn có `writing_submissions` dạng migration-only cho hướng lưu lịch sử chấm sửa writing. OCR/proofread hiện tại chủ yếu chạy stateless qua API và assistant history lưu trong `conversations`/`conversation_messages`.
