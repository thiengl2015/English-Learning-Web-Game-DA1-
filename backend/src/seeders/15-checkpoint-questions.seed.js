"use strict";

function createQuestion({ checkpointId, section, questionType, content, correctAnswer, order, now }) {
  return {
    checkpoint_id: checkpointId,
    section,
    question_type: questionType,
    content: JSON.stringify(content),
    correct_answer: JSON.stringify(correctAnswer),
    score: 1,
    display_order: order,
    is_active: true,
    created_at: now,
    updated_at: now,
  };
}

function match(checkpointId, order, unitId, question, options, selected, now) {
  return createQuestion({
    checkpointId,
    section: "A",
    questionType: "match",
    order,
    now,
    content: {
      unit_id: unitId,
      instruction: "Choose the correct answer",
      question,
      options,
    },
    correctAnswer: { selected },
  });
}

function listenWrite(checkpointId, order, unitId, audioText, options, selected, acceptedAnswers, now) {
  return createQuestion({
    checkpointId,
    section: "B",
    questionType: "listen_write",
    order,
    now,
    content: {
      unit_id: unitId,
      instruction: "Listen, choose the picture, then write the word",
      audioText,
      options,
    },
    correctAnswer: { selected, written: audioText, acceptedAnswers },
  });
}

function fillBlank(checkpointId, order, unitId, lineA, lineB, blanks, answers, now) {
  return createQuestion({
    checkpointId,
    section: "C",
    questionType: "fill_blank",
    order,
    now,
    content: {
      unit_id: unitId,
      instruction: "Choose the correct words to complete the dialogue",
      lineA,
      lineB,
      blanks,
    },
    correctAnswer: { answers },
  });
}

function unscramble(checkpointId, order, unitId, scrambled, answer, image, now) {
  return createQuestion({
    checkpointId,
    section: "D",
    questionType: "unscramble",
    order,
    now,
    content: {
      unit_id: unitId,
      instruction: "Arrange the words, then speak the sentence",
      scrambled,
      image,
    },
    correctAnswer: { answer },
  });
}

function readSpeak(checkpointId, order, unitId, question, hint, answer, acceptedAnswers, image, now) {
  return createQuestion({
    checkpointId,
    section: "E",
    questionType: "read_speak",
    order,
    now,
    content: {
      unit_id: unitId,
      instruction: "Read the question, use the hint, and speak your answer",
      question,
      hint,
      image,
    },
    correctAnswer: { answer, acceptedAnswers },
  });
}

function buildCheckpoint1(now) {
  const checkpointId = "checkpoint-1";

  return [
    match(
      checkpointId,
      1,
      1,
      "How do you greet your teacher in the morning?",
      [
        { letter: "A", text: "Good night, class." },
        { letter: "B", text: "Good morning, teacher." },
        { letter: "C", text: "It is ten dollars." },
        { letter: "D", text: "I eat rice." },
      ],
      "B",
      now
    ),
    match(
      checkpointId,
      2,
      2,
      "Who is Lan in your family?",
      [
        { letter: "A", text: "It is sunny." },
        { letter: "B", text: "I go by bus." },
        { letter: "C", text: "I buy shoes." },
        { letter: "D", text: "She is my sister." },
      ],
      "D",
      now
    ),
    match(
      checkpointId,
      3,
      3,
      "What do you do after school?",
      [
        { letter: "A", text: "I do my homework." },
        { letter: "B", text: "I am a cousin." },
        { letter: "C", text: "It costs five dollars." },
        { letter: "D", text: "I drink soup." },
      ],
      "A",
      now
    ),
    match(
      checkpointId,
      4,
      4,
      "Would you like some soup?",
      [
        { letter: "A", text: "She is my aunt." },
        { letter: "B", text: "I wake up early." },
        { letter: "C", text: "Yes, please. I am hungry." },
        { letter: "D", text: "The store is closed." },
      ],
      "C",
      now
    ),
    match(
      checkpointId,
      5,
      5,
      "How much is this T-shirt?",
      [
        { letter: "A", text: "I eat breakfast." },
        { letter: "B", text: "It is twelve dollars." },
        { letter: "C", text: "He is my uncle." },
        { letter: "D", text: "Goodbye!" },
      ],
      "B",
      now
    ),

    listenWrite(
      checkpointId,
      1,
      1,
      "classmate",
      [
        { letter: "A", image: "teacher" },
        { letter: "B", image: "classmate" },
      ],
      "B",
      ["class mate"],
      now
    ),
    listenWrite(
      checkpointId,
      2,
      2,
      "grandmother",
      [
        { letter: "A", image: "grandmother" },
        { letter: "B", image: "cashier" },
      ],
      "A",
      ["grandma"],
      now
    ),
    listenWrite(
      checkpointId,
      3,
      3,
      "homework",
      [
        { letter: "A", image: "receipt" },
        { letter: "B", image: "homework" },
      ],
      "B",
      [],
      now
    ),
    listenWrite(
      checkpointId,
      4,
      4,
      "sandwich",
      [
        { letter: "A", image: "sandwich" },
        { letter: "B", image: "shoes" },
      ],
      "A",
      [],
      now
    ),
    listenWrite(
      checkpointId,
      5,
      5,
      "receipt",
      [
        { letter: "A", image: "menu" },
        { letter: "B", image: "receipt" },
      ],
      "B",
      [],
      now
    ),

    fillBlank(
      checkpointId,
      1,
      1,
      "Hello! My ___ is Minh.",
      "Nice to ___ you.",
      [
        { id: "a1", line: "A", options: ["name", "friend", "price", "meal"] },
        { id: "b1", line: "B", options: ["meet", "buy", "cook", "sleep"] },
      ],
      { a1: "name", b1: "meet" },
      now
    ),
    fillBlank(
      checkpointId,
      2,
      2,
      "This is my ___.",
      "How old ___ she?",
      [
        { id: "a1", line: "A", options: ["sister", "breakfast", "store", "rice"] },
        { id: "b1", line: "B", options: ["is", "are", "do", "have"] },
      ],
      { a1: "sister", b1: "is" },
      now
    ),
    fillBlank(
      checkpointId,
      3,
      3,
      "I ___ up at six.",
      "Then I eat ___.",
      [
        { id: "a1", line: "A", options: ["wake", "buy", "sell", "drink"] },
        { id: "b1", line: "B", options: ["breakfast", "receipt", "aunt", "cash"] },
      ],
      { a1: "wake", b1: "breakfast" },
      now
    ),
    fillBlank(
      checkpointId,
      4,
      4,
      "I would like ___ rice.",
      "Here is your ___.",
      [
        { id: "a1", line: "A", options: ["some", "many", "much", "anywhere"] },
        { id: "b1", line: "B", options: ["plate", "shirt", "cousin", "morning"] },
      ],
      { a1: "some", b1: "plate" },
      now
    ),
    fillBlank(
      checkpointId,
      5,
      5,
      "How much ___ the shoes?",
      "They are on ___.",
      [
        { id: "a1", line: "A", options: ["are", "is", "am", "do"] },
        { id: "b1", line: "B", options: ["sale", "dinner", "family", "homework"] },
      ],
      { a1: "are", b1: "sale" },
      now
    ),

    unscramble(checkpointId, 1, 1, ["name", "is", "my", "Mai"], "my name is Mai", "greeting", now),
    unscramble(checkpointId, 2, 3, ["homework", "do", "I", "after school"], "I do homework after school", "homework", now),
    unscramble(checkpointId, 3, 5, ["this", "bag", "is", "cheap"], "this bag is cheap", "shopping bag", now),

    readSpeak(
      checkpointId,
      1,
      2,
      "Who is your mother's mother?",
      "grandmother",
      "She is my grandmother.",
      ["My grandmother.", "She is my grandma.", "Grandmother."],
      "family",
      now
    ),
    readSpeak(
      checkpointId,
      2,
      4,
      "What do you say when you want rice?",
      "would like / rice",
      "I would like some rice, please.",
      ["I would like some rice.", "Some rice, please.", "I want some rice."],
      "rice",
      now
    ),
  ];
}

function buildCheckpoint2(now) {
  const checkpointId = "checkpoint-2";

  return [
    match(
      checkpointId,
      1,
      6,
      "Where do you wait for a plane?",
      [
        { letter: "A", text: "In the kitchen." },
        { letter: "B", text: "At the hospital." },
        { letter: "C", text: "At the airport." },
        { letter: "D", text: "In the bedroom." },
      ],
      "C",
      now
    ),
    match(
      checkpointId,
      2,
      7,
      "What is the weather like when water falls from the sky?",
      [
        { letter: "A", text: "It is rainy." },
        { letter: "B", text: "It is cheap." },
        { letter: "C", text: "It is upstairs." },
        { letter: "D", text: "It is a ticket." },
      ],
      "A",
      now
    ),
    match(
      checkpointId,
      3,
      8,
      "Where do you cook dinner at home?",
      [
        { letter: "A", text: "At the bus station." },
        { letter: "B", text: "In the garden." },
        { letter: "C", text: "In the office." },
        { letter: "D", text: "In the kitchen." },
      ],
      "D",
      now
    ),
    match(
      checkpointId,
      4,
      9,
      "What does a doctor do?",
      [
        { letter: "A", text: "A doctor sells tickets." },
        { letter: "B", text: "A doctor helps sick people." },
        { letter: "C", text: "A doctor cleans bedrooms." },
        { letter: "D", text: "A doctor checks the weather." },
      ],
      "B",
      now
    ),
    match(
      checkpointId,
      5,
      10,
      "What should you do when you have a fever?",
      [
        { letter: "A", text: "Buy a plane ticket." },
        { letter: "B", text: "Open the window only." },
        { letter: "C", text: "Rest and drink water." },
        { letter: "D", text: "Move the sofa." },
      ],
      "C",
      now
    ),

    listenWrite(
      checkpointId,
      1,
      6,
      "airport",
      [
        { letter: "A", image: "airport" },
        { letter: "B", image: "hospital" },
      ],
      "A",
      [],
      now
    ),
    listenWrite(
      checkpointId,
      2,
      7,
      "rainy",
      [
        { letter: "A", image: "sunny" },
        { letter: "B", image: "rainy" },
      ],
      "B",
      ["raining"],
      now
    ),
    listenWrite(
      checkpointId,
      3,
      8,
      "kitchen",
      [
        { letter: "A", image: "kitchen" },
        { letter: "B", image: "bedroom" },
      ],
      "A",
      [],
      now
    ),
    listenWrite(
      checkpointId,
      4,
      9,
      "engineer",
      [
        { letter: "A", image: "chef" },
        { letter: "B", image: "engineer" },
      ],
      "B",
      [],
      now
    ),
    listenWrite(
      checkpointId,
      5,
      10,
      "medicine",
      [
        { letter: "A", image: "medicine" },
        { letter: "B", image: "ticket" },
      ],
      "A",
      [],
      now
    ),

    fillBlank(
      checkpointId,
      1,
      6,
      "I go to the airport by ___.",
      "I have a plane ___.",
      [
        { id: "a1", line: "A", options: ["taxi", "fever", "sofa", "rain"] },
        { id: "b1", line: "B", options: ["ticket", "medicine", "doctor", "window"] },
      ],
      { a1: "taxi", b1: "ticket" },
      now
    ),
    fillBlank(
      checkpointId,
      2,
      7,
      "It is ___ today.",
      "Take an ___.",
      [
        { id: "a1", line: "A", options: ["rainy", "airport", "healthy", "office"] },
        { id: "b1", line: "B", options: ["umbrella", "passport", "bedroom", "engineer"] },
      ],
      { a1: "rainy", b1: "umbrella" },
      now
    ),
    fillBlank(
      checkpointId,
      3,
      8,
      "The sofa is in the ___ room.",
      "The lamp is next ___ the table.",
      [
        { id: "a1", line: "A", options: ["living", "plane", "sick", "future"] },
        { id: "b1", line: "B", options: ["to", "at", "from", "by"] },
      ],
      { a1: "living", b1: "to" },
      now
    ),
    fillBlank(
      checkpointId,
      4,
      9,
      "She works in a ___.",
      "She is a ___.",
      [
        { id: "a1", line: "A", options: ["hospital", "season", "bathroom", "passport"] },
        { id: "b1", line: "B", options: ["doctor", "hotel", "chair", "wind"] },
      ],
      { a1: "hospital", b1: "doctor" },
      now
    ),
    fillBlank(
      checkpointId,
      5,
      10,
      "I have a ___.",
      "You should take ___.",
      [
        { id: "a1", line: "A", options: ["headache", "salary", "garden", "luggage"] },
        { id: "b1", line: "B", options: ["medicine", "ticket", "window", "meeting"] },
      ],
      { a1: "headache", b1: "medicine" },
      now
    ),

    unscramble(checkpointId, 1, 6, ["need", "a", "ticket", "I"], "I need a ticket", "ticket", now),
    unscramble(checkpointId, 2, 8, ["bedroom", "is", "upstairs", "the"], "the bedroom is upstairs", "bedroom", now),
    unscramble(checkpointId, 3, 10, ["drink", "water", "more", "should", "you"], "you should drink more water", "water", now),

    readSpeak(
      checkpointId,
      1,
      7,
      "What do you wear when it is cold?",
      "coat",
      "I wear a coat.",
      ["A coat.", "I wear my coat."],
      "coat",
      now
    ),
    readSpeak(
      checkpointId,
      2,
      9,
      "What job fixes computer problems?",
      "engineer",
      "An engineer fixes computer problems.",
      ["An engineer.", "A computer engineer.", "The engineer fixes computer problems."],
      "engineer",
      now
    ),
  ];
}

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const questions = [...buildCheckpoint1(now), ...buildCheckpoint2(now)];

    await queryInterface.bulkDelete("question_checkpoints", null, {});
    await queryInterface.bulkInsert("question_checkpoints", questions, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("question_checkpoints", null, {});
  },
};
