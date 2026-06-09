"use strict";

const UNIT_CHALLENGES = [
  { unitId: 1, topic: "greetings", words: ["hello", "name", "friend", "meet", "fine"] },
  { unitId: 2, topic: "family", words: ["mother", "father", "sister", "brother", "family"] },
  { unitId: 3, topic: "routines", words: ["wake up", "breakfast", "school", "homework", "sleep"] },
  { unitId: 4, topic: "food", words: ["pizza", "water", "sandwich", "apple", "rice"] },
  { unitId: 5, topic: "shopping", words: ["money", "store", "price", "bag", "buy"] },
  { unitId: 6, topic: "travel", words: ["bus", "train", "airport", "ticket", "hotel"] },
  { unitId: 7, topic: "weather", words: ["sunny", "rainy", "cloudy", "windy", "snowy"] },
  { unitId: 8, topic: "home", words: ["kitchen", "bedroom", "chair", "table", "window"] },
  { unitId: 9, topic: "work", words: ["teacher", "doctor", "office", "job", "meeting"] },
  { unitId: 10, topic: "health", words: ["healthy", "exercise", "water", "doctor", "tired"] },
  { unitId: 11, topic: "technology", words: ["computer", "internet", "phone", "keyboard", "screen"] },
  { unitId: 12, topic: "hobbies", words: ["music", "game", "movie", "reading", "drawing"] },
];

function now() {
  return new Date();
}

function challengeQuestionsForUnit({ unitId, topic, words }) {
  const [w1, w2, w3, w4, w5] = words;
  const timestamp = now();

  return [
    {
      unit_id: unitId,
      section: "A",
      question_type: "match",
      content: JSON.stringify({
        instruction: "Choose the correct answer",
        question: `Which word belongs to ${topic}?`,
        options: [
          { letter: "A", text: w1 },
          { letter: "B", text: "yesterday" },
          { letter: "C", text: "purple" },
        ],
      }),
      correct_answer: JSON.stringify({ selected: "A" }),
      score: 1,
      display_order: 1,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "A",
      question_type: "match",
      content: JSON.stringify({
        instruction: "Choose the correct answer",
        question: `Complete the idea: This unit helps me talk about ___`,
        options: [
          { letter: "A", text: "numbers only" },
          { letter: "B", text: topic },
          { letter: "C", text: "colors only" },
        ],
      }),
      correct_answer: JSON.stringify({ selected: "B" }),
      score: 1,
      display_order: 2,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "A",
      question_type: "match",
      content: JSON.stringify({
        instruction: "Choose the correct answer",
        question: `Which sentence uses "${w2}" correctly?`,
        options: [
          { letter: "A", text: `I ${w2} under blue.` },
          { letter: "B", text: `${w2} is seven yesterday.` },
          { letter: "C", text: `I can say "${w2}" in English.` },
        ],
      }),
      correct_answer: JSON.stringify({ selected: "C" }),
      score: 1,
      display_order: 3,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "B",
      question_type: "listen_write",
      content: JSON.stringify({
        instruction: "Listen, choose the picture, then write the word",
        audioText: w3,
        options: [
          { letter: "A", image: w3 },
          { letter: "B", image: w4 },
          { letter: "C", image: w5 },
        ],
      }),
      correct_answer: JSON.stringify({ selected: "A", written: w3 }),
      score: 1,
      display_order: 1,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "B",
      question_type: "listen_write",
      content: JSON.stringify({
        instruction: "Listen, choose the picture, then write the word",
        audioText: w4,
        options: [
          { letter: "A", image: w1 },
          { letter: "B", image: w4 },
          { letter: "C", image: w2 },
        ],
      }),
      correct_answer: JSON.stringify({ selected: "B", written: w4 }),
      score: 1,
      display_order: 2,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "C",
      question_type: "fill_blank",
      content: JSON.stringify({
        instruction: "Choose the correct word to complete the dialogue",
        lineA: `I know the word ___.`,
        lineB: "Great job!",
        blankInA: true,
        options: [w1, "wrong", "later"],
      }),
      correct_answer: JSON.stringify({ answer: w1 }),
      score: 1,
      display_order: 1,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "C",
      question_type: "fill_blank",
      content: JSON.stringify({
        instruction: "Choose the correct word to complete the dialogue",
        lineA: `This lesson is about ${topic}.`,
        lineB: `I can say ___.`,
        blankInA: false,
        options: [w5, "banana", "seven"],
      }),
      correct_answer: JSON.stringify({ answer: w5 }),
      score: 1,
      display_order: 2,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "D",
      question_type: "listen_repeat",
      content: JSON.stringify({
        instruction: "Listen and repeat",
        audioText: w1,
        image: w1,
      }),
      correct_answer: JSON.stringify({ answer: w1 }),
      score: 1,
      display_order: 1,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "D",
      question_type: "listen_repeat",
      content: JSON.stringify({
        instruction: "Listen and repeat",
        audioText: w2,
        image: w2,
      }),
      correct_answer: JSON.stringify({ answer: w2 }),
      score: 1,
      display_order: 2,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
    {
      unit_id: unitId,
      section: "D",
      question_type: "listen_repeat",
      content: JSON.stringify({
        instruction: "Listen and repeat",
        audioText: w5,
        image: w5,
      }),
      correct_answer: JSON.stringify({ answer: w5 }),
      score: 1,
      display_order: 3,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
    },
  ];
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const questions = UNIT_CHALLENGES.flatMap(challengeQuestionsForUnit);

    for (const question of questions) {
      await queryInterface.insert(null, "question_challenges", question, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("question_challenges", null, {});
  },
};
