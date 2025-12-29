const OpenAI = require("openai");

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 500;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
  }

  isConfigured() {
    return (
      !!process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY.startsWith("sk-")
    );
  }

  getSystemPrompt(topic) {
    const prompts = {
      "daily-life": `You are a friendly English conversation partner helping a Vietnamese student practice everyday English. 
        - Keep responses simple and natural
        - Correct grammar mistakes gently
        - Ask follow-up questions to continue the conversation
        - Use common daily life vocabulary
        - Respond in 2-3 sentences maximum`,

      travel: `You are an English teacher helping students practice travel conversations.
        - Use common travel vocabulary and phrases
        - Include questions about destinations, hotels, transportation
        - Correct mistakes and suggest better phrases
        - Keep it practical and conversational`,

      work: `You are a professional English coach helping with workplace communication.
        - Focus on business English and professional terminology
        - Help with emails, meetings, presentations
        - Provide formal alternatives when appropriate
        - Keep responses professional but friendly`,

      food: `You are helping students practice English conversations about food.
        - Discuss restaurants, cooking, recipes, ordering food
        - Teach food-related vocabulary
        - Ask about favorite dishes and eating habits
        - Keep it fun and engaging`,

      hobbies: `You are a conversation partner discussing hobbies and interests.
        - Talk about sports, music, movies, books, games
        - Share opinions and ask for theirs
        - Use present simple and present continuous tenses
        - Keep it casual and interesting`,

      general: `You are a friendly English teacher helping students practice conversation.
        - Adapt to any topic the student wants to discuss
        - Correct mistakes kindly
        - Ask engaging follow-up questions
        - Keep responses clear and helpful`,
    };

    return prompts[topic] || prompts["general"];
  }

  async chat(messages, options = {}) {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key is not configured");
    }

    const {
      temperature = this.temperature,
      max_tokens = this.maxTokens,
      system_prompt = null,
    } = options;

    try {
      const chatMessages = [];

      if (system_prompt) {
        chatMessages.push({
          role: "system",
          content: system_prompt,
        });
      }

      chatMessages.push(...messages);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: chatMessages,
        temperature: temperature,
        max_tokens: max_tokens,
      });

      return {
        content: response.choices[0].message.content,
        tokens_used: response.usage.total_tokens,
        model: response.model,
      };
    } catch (error) {
      console.error("OpenAI API Error:", error);

      if (error.status === 401) {
        throw new Error("Invalid OpenAI API key");
      }
      if (error.status === 429) {
        throw new Error("OpenAI rate limit exceeded. Please try again later.");
      }
      if (error.status === 500) {
        throw new Error("OpenAI service error. Please try again later.");
      }

      throw new Error(`OpenAI error: ${error.message}`);
    }
  }

  async generateJSON(prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error("OpenAI API key is not configured");
    }

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that responds ONLY with valid JSON. Do not include any text before or after the JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
      });

      const content = response.choices[0].message.content.trim();

      const cleanContent = content
        .replace(/```json\n/g, "")
        .replace(/```\n/g, "")
        .replace(/```/g, "")
        .trim();

      return {
        data: JSON.parse(cleanContent),
        tokens_used: response.usage.total_tokens,
      };
    } catch (error) {
      console.error("OpenAI JSON Generation Error:", error);
      throw new Error(`Failed to generate JSON: ${error.message}`);
    }
  }
}

module.exports = new OpenAIService();
