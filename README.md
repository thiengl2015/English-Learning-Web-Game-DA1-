# English-Learning-Web-Game-DA1-

Dự án Web Game học tiếng Anh, tích hợp AI để tạo câu hỏi và gợi ý học tập như một giáo viên ảo.  
Sinh viên có thể chơi game, luyện tập các kỹ năng tiếng Anh (từ vựng, ngữ pháp, phát âm, ...) và nhận phản hồi tức thì.

---

## 🚀 Công nghệ sử dụng

### Frontend

- [Next.js](https://nextjs.org/) 15.2.4 → React framework với SSR, hiệu suất cao.
- [Tailwind CSS](https://tailwindcss.com/) → style nhanh, tiện, responsive.
- [TypeScript](https://www.typescriptlang.org/) → type safety.
- [Radix UI](https://www.radix-ui.com/) → thành phần UI không style.

### Backend

- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) → xây dựng REST API.
- [Sequelize](https://sequelize.org/) → ORM cho MySQL.
- [OpenAI API](https://platform.openai.com/) → sinh câu hỏi, phân tích kết quả học tập.
- [JWT](https://jwt.io/) → xác thực người dùng.
- [MySQL](https://www.mysql.com/) → cơ sở dữ liệu.

---

## 📂 Cấu trúc dự án

```
English-Learning-Web-Game-DA1/
│── backend/                 # Server Node.js + Express API
│   ├── src/
│   │   ├── app.js          # Express app config
│   │   ├── config/         # Database config
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models (Sequelize)
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middlewares/    # Custom middlewares
│   ├── server.js           # Server entry point
│   └── package.json
│
│── FE/                     # Frontend - Next.js 15 + TypeScript
│   ├── app/                # App router (Next.js 15)
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities & helpers
│   ├── public/             # Static files
│   ├── styles/             # Global styles
│   └── package.json
│
├── README.md               # Tài liệu dự án
└── database-schema-erd.md  # Sơ đồ cơ sở dữ liệu
```

## ⚙️ Cài đặt và chạy dự án

### Yêu cầu hệ thống
- **Node.js**: v18+ 
- **npm**: v9+
- **MySQL**: v8+ (hoặc MariaDB)

### 1. Clone và cài đặt toàn cục

```bash
git clone https://github.com/thiengl2015/English-Learning-Web-Game-DA1-.git
cd English-Learning-Web-Game-DA1-
```

### 2. Cấu hình Database

1. Tạo file `.env` tại thư mục **backend/**:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=english_learning_game
DB_PORT=3306

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key_here

# OpenAI (tùy chọn)
OPENAI_API_KEY=your_openai_key
```

2. Tạo cơ sở dữ liệu MySQL:
```sql
CREATE DATABASE english_learning_game;
```

### 3. Cài đặt và khởi động Backend

```bash
cd backend
npm install
npm run dev
```

Backend sẽ chạy tại: **http://localhost:5000**

Health check endpoint: `http://localhost:5000/health`

### 4. Cài đặt và khởi động Frontend

Mở terminal mới và:

```bash
cd FE
npm install
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3000**

### 5. Tạo dữ liệu ban đầu (Seeders)

Sau khi backend khởi động thành công, bạn có thể chạy seeders để tạo dữ liệu mẫu:

```bash
cd backend
npm run seed  # (nếu script này được cấu hình)
```

Hoặc sử dụng Sequelize CLI:
```bash
npx sequelize-cli db:seed:all
```

---

## 🚀 Quick Start (Khởi động nhanh)

**Terminal 1 - Backend:**
```bash
cd backend && npm install && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd FE && npm install && npm run dev
```

Sau đó mở trình duyệt tại: **http://localhost:3000**

---

## 📝 Scripts khả dụng

### Backend
- `npm start` - Chạy server (production)
- `npm run dev` - Chạy server với nodemon (development, auto-reload)

### Frontend  
- `npm run dev` - Development server
- `npm run build` - Build cho production
- `npm start` - Chạy production build
- `npm run lint` - Kiểm tra code style
}

👉 Nếu chữ hiện màu xanh, to, đậm → Tailwind hoạt động thành công ✅

🎯 Chức năng hiện tại

Giao diện React + Tailwind cơ bản.

Gọi API backend để nhận câu hỏi demo.

Hiển thị câu hỏi trong giao diện.

📌 Roadmap (dự kiến)

Tích hợp OpenAI API để sinh câu hỏi thật.

Phân loại câu hỏi (ngữ pháp, từ vựng, phát âm).

Gợi ý bài tập bổ sung dựa trên điểm yếu của học sinh.

Thêm mini-game (quiz, flashcard, luyện phát âm).

Tích hợp đăng nhập, lưu tiến trình học.
