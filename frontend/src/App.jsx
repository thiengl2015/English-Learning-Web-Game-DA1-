import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const getQuestion = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/generate-question`
      );
      setQuestion(res.data.question);
    } catch (err) {
      console.error("Error fetching question:", err);
      setQuestion("Failed to fetch question 😢");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col items-center space-y-4">
      <h1 className="text-3xl font-bold text-blue-600">
        English Learning Game
      </h1>
      <button
        onClick={getQuestion}
        disabled={loading}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
      >
        {loading ? "Loading..." : "Get a Question"}
      </button>
      <p className="text-lg text-gray-800">{question}</p>
    </div>
  );
}

export default App;
