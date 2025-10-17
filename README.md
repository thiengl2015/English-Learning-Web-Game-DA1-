# English-Learning-Web-Game-DA1-

Dự án Web Game học tiếng Anh, tích hợp AI để tạo câu hỏi và gợi ý học tập như một giáo viên ảo.  
Sinh viên có thể chơi game, luyện tập các kỹ năng tiếng Anh (từ vựng, ngữ pháp, phát âm, ...) và nhận phản hồi tức thì.

---

## 🚀 Công nghệ sử dụng

### Frontend

- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) → phát triển giao diện nhanh, hiện đại.
- [Tailwind CSS](https://tailwindcss.com/) → giúp style nhanh, tiện, responsive.
- [Axios](https://axios-http.com/) → gọi API từ backend.

### Backend

- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) → xây dựng API.
- (Tương lai) [OpenAI API](https://platform.openai.com/) → sinh câu hỏi, phân tích kết quả học tập.

---

## 📂 Cấu trúc dự án

English-Learning-Web-Game-DA1/
│── backend/ # Server Node.js (Express API)
│ └── index.js
│── frontend/ # React + Vite + Tailwind
│ ├── app
│ ├── components
│ | ├── ui
│ ├── hooks
│ ├── libs
│ ├── styles
│ ├── components.json
│ ├── next.config.mjs
│ ├── package-lock.json
│ ├── package.json
│ └── tsconfig.json
│── README.md # Tài liệu dự án

## ⚙️ Cài đặt và chạy dự án

### 1. Clone dự án

```bash
git clone https://github.com/<your-username>/English-Learning-Web-Game-DA1.git
cd English-Learning-Web-Game-DA1
```

### 2. Cài đặt Backend

cd backend
npm install
node index.js

Mặc định server chạy tại: http://localhost:3001

### 3. Cài đặt Frontend

cd ../frontend
npm install
npm run dev

Mở trình duyệt tại: http://localhost:3000

🎨 Cấu hình Tailwind CSS (Frontend)

Dự án đã được setup sẵn, nếu bạn muốn config lại thì làm theo:

Bước 1: Cài Tailwind + PostCSS + Autoprefixer
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p

Bước 2: Cấu hình tailwind.config.js
/** @type {import('tailwindcss').Config} \*/
export default {
content: [
"./index.html",
"./src/**/\*.{js,ts,jsx,tsx}",
],
theme: {
extend: {},
},
plugins: [],
}

Bước 3: Import Tailwind trong src/index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

Bước 4: Test trong App.jsx
export default function App() {
return (

<h1 className="text-4xl font-bold text-blue-600">
Hello Tailwind!
</h1>
)
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
