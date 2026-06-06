require("dotenv").config({ path: "./.env.test" });
const { sequelize, UnitTestConfig, QuestionCheckpoint } = require("./src/models");

async function seed() {
  console.log("Seeding checkpoint data...");
  try {
    // Seed configs
    await UnitTestConfig.bulkCreate([
      {
        id: "checkpoint-1",
        test_type: "checkpoint",
        title: "Checkpoint 1: Units 1-5",
        description: "Test covering Units 1 to 5. Pass with 80% to unlock Units 6-10.",
        units_covered: [1, 2, 3, 4, 5],
        pass_threshold: 80,
        total_score: 20,
        is_active: true,
      },
      {
        id: "checkpoint-2",
        test_type: "checkpoint",
        title: "Checkpoint 2: Units 6-10",
        description: "Test covering Units 6 to 10. Pass with 80% to complete the course.",
        units_covered: [6, 7, 8, 9, 10],
        pass_threshold: 80,
        total_score: 20,
        is_active: true,
      },
    ], {
      updateOnDuplicate: ["title", "description", "units_covered", "pass_threshold", "total_score"],
    });
    console.log("Checkpoint configs seeded: 2");

    // Seed questions for checkpoint-1
    const cp1Questions = [
      // Section A (5 questions)
      { checkpoint_id: "checkpoint-1", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "What do you do every morning?", options: [{ letter: "A", text: "I wake up and eat breakfast." }, { letter: "B", text: "I go to sleep." }, { letter: "C", text: "I watch TV." }, { letter: "D", text: "I play football." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-1", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "Where is the school?", options: [{ letter: "A", text: "It is next to the park." }, { letter: "B", text: "It is in the kitchen." }, { letter: "C", text: "It is under the bed." }, { letter: "D", text: "It is in the garden." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 2 },
      { checkpoint_id: "checkpoint-1", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "What time do you usually go to bed?", options: [{ letter: "A", text: "I go to bed at 10 PM." }, { letter: "B", text: "I go to school at 10 PM." }, { letter: "C", text: "I eat breakfast at 10 PM." }, { letter: "D", text: "I play games at 10 PM." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 3 },
      { checkpoint_id: "checkpoint-1", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "How was your weekend?", options: [{ letter: "A", text: "It was great, thanks!" }, { letter: "B", text: "It is Monday today." }, { letter: "C", text: "I am at home." }, { letter: "D", text: "The weather is sunny." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 4 },
      { checkpoint_id: "checkpoint-1", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "Do you like playing football?", options: [{ letter: "A", text: "Yes, I do. It is fun!" }, { letter: "B", text: "The ball is round." }, { letter: "C", text: "Three players joined." }, { letter: "D", text: "I read a book." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 5 },
      // Section B (5 questions) - score = 1 per question
      { checkpoint_id: "checkpoint-1", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "basketball", options: [{ letter: "A", image: "soccer" }, { letter: "B", image: "basketball" }] }, correct_answer: { selected: "B", written: "basketball" }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-1", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "a scooter", options: [{ letter: "A", image: "bicycle" }, { letter: "B", image: "scooter" }] }, correct_answer: { selected: "B", written: "a scooter" }, score: 1, display_order: 2 },
      { checkpoint_id: "checkpoint-1", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "tape", options: [{ letter: "A", image: "tape" }, { letter: "B", image: "glue" }] }, correct_answer: { selected: "A", written: "tape" }, score: 1, display_order: 3 },
      { checkpoint_id: "checkpoint-1", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "rubber bands", options: [{ letter: "A", image: "rubber bands" }, { letter: "B", image: "pencils" }] }, correct_answer: { selected: "A", written: "rubber bands" }, score: 1, display_order: 4 },
      { checkpoint_id: "checkpoint-1", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "across from", options: [{ letter: "A", image: "arrow-right" }, { letter: "B", image: "opposite" }] }, correct_answer: { selected: "B", written: "across from" }, score: 1, display_order: 5 },
      // Section C (5 questions)
      { checkpoint_id: "checkpoint-1", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "Hi, I'm Scott. What's ___?", lineB: "I'm Kate. Nice to meet you!", blankInA: true, options: ["your name", "you name", "name your", "my name"] }, correct_answer: { answer: "your name" }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-1", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "Hello! ___ are you?", lineB: "I'm fine, thanks!", blankInA: true, options: ["How", "What", "Where", "When"] }, correct_answer: { answer: "How" }, score: 1, display_order: 2 },
      { checkpoint_id: "checkpoint-1", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "Hi, Anna! This is my friend Sarah.", lineB: "___, Anna!", blankInA: false, options: ["Nice to meet you", "How are you", "Goodbye", "Hello"] }, correct_answer: { answer: "Nice to meet you" }, score: 1, display_order: 3 },
      { checkpoint_id: "checkpoint-1", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "Where were you yesterday?", lineB: "I was ___ the library.", blankInA: false, options: ["at", "in", "on", "to"] }, correct_answer: { answer: "at" }, score: 1, display_order: 4 },
      { checkpoint_id: "checkpoint-1", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "Do you have a ruler?", lineB: "Yes, I ___ one.", blankInA: false, options: ["have", "has", "had", "having"] }, correct_answer: { answer: "have" }, score: 1, display_order: 5 },
      // Section D (3 questions)
      { checkpoint_id: "checkpoint-1", section: "D", question_type: "unscramble", content: { instruction: "Arrange the words to make a correct sentence", scrambled: ["cold", "was", "it"], image: "snow" }, correct_answer: { answer: "it was cold" }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-1", section: "D", question_type: "unscramble", content: { instruction: "Arrange the words to make a correct sentence", scrambled: ["ruler", "a", "have", "I"], image: "ruler" }, correct_answer: { answer: "i have a ruler" }, score: 1, display_order: 2 },
      { checkpoint_id: "checkpoint-1", section: "D", question_type: "unscramble", content: { instruction: "Arrange the words to make a correct sentence", scrambled: ["she", "does", "live", "where"], image: "house" }, correct_answer: { answer: "where does she live" }, score: 1, display_order: 3 },
      // Section E (2 questions)
      { checkpoint_id: "checkpoint-1", section: "E", question_type: "read_speak", content: { instruction: "Read the sentence and speak it clearly", sentence: "I wake up at six o'clock every morning.", hint: "wake up" }, correct_answer: { confirmed: true }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-1", section: "E", question_type: "read_speak", content: { instruction: "Read the sentence and speak it clearly", sentence: "The school is next to the park.", hint: "next to" }, correct_answer: { confirmed: true }, score: 1, display_order: 2 },
    ];
    await QuestionCheckpoint.destroy({ where: { checkpoint_id: "checkpoint-1" }, force: true });
    await QuestionCheckpoint.bulkCreate(cp1Questions);
    console.log("Checkpoint-1 questions seeded: " + cp1Questions.length);

    // Seed questions for checkpoint-2
    const cp2Questions = [
      // Section A (5 questions)
      { checkpoint_id: "checkpoint-2", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "What is your mother doing now?", options: [{ letter: "A", text: "She is cooking dinner." }, { letter: "B", text: "She goes to school." }, { letter: "C", text: "She played football." }, { letter: "D", text: "She will eat." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-2", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "Where did you go last weekend?", options: [{ letter: "A", text: "I went to the beach." }, { letter: "B", text: "I go to the park." }, { letter: "C", text: "I am at home." }, { letter: "D", text: "I will visit my grandma." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 2 },
      { checkpoint_id: "checkpoint-2", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "How many apples are there?", options: [{ letter: "A", text: "There are five apples." }, { letter: "B", text: "There is one apple." }, { letter: "C", text: "There are ten apples." }, { letter: "D", text: "There are no apples." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 3 },
      { checkpoint_id: "checkpoint-2", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "What is the weather like today?", options: [{ letter: "A", text: "It is sunny and warm." }, { letter: "B", text: "It is cold and snowy." }, { letter: "C", text: "It is rainy." }, { letter: "D", text: "It is windy." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 4 },
      { checkpoint_id: "checkpoint-2", section: "A", question_type: "match", content: { instruction: "Choose the correct answer", question: "Who is your best friend?", options: [{ letter: "A", text: "It is Nam. He is kind." }, { letter: "B", text: "She is my teacher." }, { letter: "C", text: "He plays soccer." }, { letter: "D", text: "I have many friends." }] }, correct_answer: { selected: "A" }, score: 1, display_order: 5 },
      // Section B (5 questions) - score = 1 per question
      { checkpoint_id: "checkpoint-2", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "sandwich", options: [{ letter: "A", image: "sandwich" }, { letter: "B", image: "hamburger" }] }, correct_answer: { selected: "A", written: "sandwich" }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-2", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "raining", options: [{ letter: "A", image: "sunny" }, { letter: "B", image: "raining" }] }, correct_answer: { selected: "B", written: "raining" }, score: 1, display_order: 2 },
      { checkpoint_id: "checkpoint-2", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "swimming", options: [{ letter: "A", image: "running" }, { letter: "B", image: "swimming" }] }, correct_answer: { selected: "B", written: "swimming" }, score: 1, display_order: 3 },
      { checkpoint_id: "checkpoint-2", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "library", options: [{ letter: "A", image: "library" }, { letter: "B", image: "classroom" }] }, correct_answer: { selected: "A", written: "library" }, score: 1, display_order: 4 },
      { checkpoint_id: "checkpoint-2", section: "B", question_type: "listen_write", content: { instruction: "Listen, choose the picture, then write the word", audioText: "hospital", options: [{ letter: "A", image: "school" }, { letter: "B", image: "hospital" }] }, correct_answer: { selected: "B", written: "hospital" }, score: 1, display_order: 5 },
      // Section C (5 questions)
      { checkpoint_id: "checkpoint-2", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "I ___ to school every day.", lineB: "That is great!", blankInA: true, options: ["go", "went", "going", "goes"] }, correct_answer: { answer: "go" }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-2", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "The cat is ___ the table.", lineB: "I see it!", blankInA: true, options: ["on", "in", "under", "behind"] }, correct_answer: { answer: "on" }, score: 1, display_order: 2 },
      { checkpoint_id: "checkpoint-2", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "Tom has two ___.", lineB: "What are they?", blankInA: true, options: ["dogs", "dog", "a dog", "dogs are"] }, correct_answer: { answer: "dogs" }, score: 1, display_order: 3 },
      { checkpoint_id: "checkpoint-2", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "What ___ you do yesterday?", lineB: "I played soccer.", blankInA: true, options: ["did", "do", "does", "doing"] }, correct_answer: { answer: "did" }, score: 1, display_order: 4 },
      { checkpoint_id: "checkpoint-2", section: "C", question_type: "fill_blank", content: { instruction: "Choose the correct word to complete the sentence", lineA: "My birthday is ___ March.", lineB: "That is soon!", blankInA: false, options: ["in", "on", "at", "to"] }, correct_answer: { answer: "in" }, score: 1, display_order: 5 },
      // Section D (3 questions)
      { checkpoint_id: "checkpoint-2", section: "D", question_type: "unscramble", content: { instruction: "Arrange the words to make a correct sentence", scrambled: ["play", "football", "We", "often"], image: "football" }, correct_answer: { answer: "we often play football" }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-2", section: "D", question_type: "unscramble", content: { instruction: "Arrange the words to make a correct sentence", scrambled: ["my", "is", "name", "Nam"], image: "person" }, correct_answer: { answer: "my name is nam" }, score: 1, display_order: 2 },
      { checkpoint_id: "checkpoint-2", section: "D", question_type: "unscramble", content: { instruction: "Arrange the words to make a correct sentence", scrambled: ["like", "I", "apples", "do"], image: "apple" }, correct_answer: { answer: "i do like apples" }, score: 1, display_order: 3 },
      // Section E (2 questions)
      { checkpoint_id: "checkpoint-2", section: "E", question_type: "read_speak", content: { instruction: "Read the sentence and speak it clearly", sentence: "She is reading a book in the library.", hint: "reading" }, correct_answer: { confirmed: true }, score: 1, display_order: 1 },
      { checkpoint_id: "checkpoint-2", section: "E", question_type: "read_speak", content: { instruction: "Read the sentence and speak it clearly", sentence: "They went to the beach last summer.", hint: "went" }, correct_answer: { confirmed: true }, score: 1, display_order: 2 },
    ];
    await QuestionCheckpoint.destroy({ where: { checkpoint_id: "checkpoint-2" }, force: true });
    await QuestionCheckpoint.bulkCreate(cp2Questions);
    console.log("Checkpoint-2 questions seeded: " + cp2Questions.length);

    console.log("All checkpoint data seeded successfully!");
    await sequelize.close();
  } catch (error) {
    console.error("Seeding failed:", error);
    await sequelize.close();
    process.exit(1);
  }
}

seed();
