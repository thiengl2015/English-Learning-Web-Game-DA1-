import { useState } from "react";
import axios from "axios"; // ✅ cần import axios
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");

  const getQuestion = async () => {
    try {
      const res = await axios.post("http://localhost:3001/generate-question");
      setQuestion(res.data.question);
    } catch (err) {
      console.error("Error fetching question:", err);
      setQuestion("Failed to fetch question 😢");
    }
  };

  return (
    <div className="p-6 flex flex-col items-center space-y-4">
      <h1 className="text-3xl font-bold text-blue-600">
        English Learning Game
      </h1>
      <button
        onClick={getQuestion}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        Get a Question
      </button>
      <p className="text-lg text-gray-800">{question}</p>
    </div>
  );
}

export default App;
