const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running without OpenAI!");
});

app.get("/sample-question", (req, res) => {
  res.json({
    type: "Grammar",
    question: "Choose the correct verb form: She ___ to school every day.",
    options: ["go", "goes", "went", "gone"],
    answer: "goes",
  });
});

app.listen(3001, () =>
  console.log("✅ Backend running on http://localhost:3001")
);
