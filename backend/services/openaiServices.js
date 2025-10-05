const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const generateQuestion = async () => {
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

  let responseText = completion.choices[0].message.content;
  try {
    return JSON.parse(responseText);
  } catch {
    return { question: responseText }; // fallback
  }
};

module.exports = { generateQuestion };
