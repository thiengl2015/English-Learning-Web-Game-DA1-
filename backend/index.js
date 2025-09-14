const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Khởi tạo OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test route
app.get("/", (req, res) => {
  res.send("✅ Backend is running with OpenAI!");
});

// API: generate English question
app.post("/generate-question", async (req, res) => {
  try {
    const prompt = `
    Hãy tạo một câu hỏi trắc nghiệm tiếng Anh cơ bản về ngữ pháp.
    Trả về JSON với format:
    {
      "type": "Grammar",
      "question": "Câu hỏi ở đây",
      "options": ["A", "B", "C", "D"],
      "answer": "Đáp án đúng"
    }
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    let question;
    try {
      question = JSON.parse(responseText);
    } catch (err) {
      question = { question: responseText };
    }

    res.json(question);
  } catch (error) {
    console.error("❌ Lỗi khi gọi OpenAI:", error);
    res.status(500).json({ error: "Lỗi khi gọi OpenAI API" });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
);
