const {
  GameConfig,
  GameSession,
  GameWrongAnswer,
  Vocabulary,
  Grammar,
  Unit,
  Lesson,
  LessonProgress,
  UserProgress,
  User,
} = require("../models");
const { Op } = require("sequelize");
const userService = require("./user.service");
const missionService = require("./mission.service");
const vocabularyService = require("./vocabulary.service");
const {
  getDefaultGameTypeForLesson,
  isGameTypeAllowedForLesson,
  pickPrimaryLessonGameConfig,
} = require("../utils/lesson-game.util");

const GALAXY_MATCH_PAIR_COUNT = 6;

const lexemeKey = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const VOCABULARY_USAGE_BANK = {
  hello: {
    partOfSpeech: "interjection",
    sentence: "Hello, my name is Anna.",
    translation: "Xin chao, ten toi la Anna.",
  },
  goodbye: {
    partOfSpeech: "interjection",
    sentence: "We say goodbye after class.",
    translation: "Chung toi noi tam biet sau gio hoc.",
  },
  please: {
    partOfSpeech: "adverb",
    sentence: "Please open the door.",
    translation: "Lam on hay mo cua.",
  },
  "thank you": {
    partOfSpeech: "interjection",
    sentence: "Thank you for your help.",
    translation: "Cam on vi su giup do cua ban.",
  },
  sorry: {
    partOfSpeech: "adjective",
    sentence: "I am sorry.",
    translation: "Toi xin loi.",
  },
  yes: {
    partOfSpeech: "interjection",
    sentence: "Yes, I am ready.",
    translation: "Vang, toi da san sang.",
  },
  no: {
    partOfSpeech: "interjection",
    sentence: "No, I am not ready.",
    translation: "Khong, toi chua san sang.",
  },
  "excuse me": {
    partOfSpeech: "interjection",
    sentence: "Excuse me, where is the station?",
    translation: "Xin loi, nha ga o dau?",
  },
  welcome: {
    partOfSpeech: "interjection",
    sentence: "Welcome to our class.",
    translation: "Chao mung den lop hoc cua chung toi.",
  },
  "good morning": {
    partOfSpeech: "interjection",
    sentence: "Good morning, teacher.",
    translation: "Chao buoi sang, thay co.",
  },
  name: {
    partOfSpeech: "noun",
    sentence: "My name is Anna.",
    translation: "Ten toi la Anna.",
  },
  my: {
    partOfSpeech: "determiner",
    sentence: "My book is on the table.",
    translation: "Quyen sach cua toi o tren ban.",
  },
  your: {
    partOfSpeech: "determiner",
    sentence: "Your bag is blue.",
    translation: "Cap cua ban mau xanh.",
  },
  nice: {
    partOfSpeech: "adjective",
    sentence: "She is a nice friend.",
    translation: "Co ay la mot nguoi ban tot.",
  },
  meet: {
    partOfSpeech: "verb",
    sentence: "I want to meet your family.",
    translation: "Toi muon gap gia dinh ban.",
  },
  i: {
    partOfSpeech: "pronoun",
    sentence: "I am a student.",
    translation: "Toi la hoc sinh.",
  },
  you: {
    partOfSpeech: "pronoun",
    sentence: "You are my friend.",
    translation: "Ban la ban cua toi.",
  },
  am: {
    partOfSpeech: "verb",
    sentence: "I am happy today.",
    translation: "Hom nay toi vui.",
  },
  are: {
    partOfSpeech: "verb",
    sentence: "You are in my class.",
    translation: "Ban o trong lop cua toi.",
  },
  from: {
    partOfSpeech: "preposition",
    sentence: "I am from Viet Nam.",
    translation: "Toi den tu Viet Nam.",
  },
  family: {
    partOfSpeech: "noun",
    sentence: "My family is small.",
    translation: "Gia dinh toi nho.",
  },
  father: {
    partOfSpeech: "noun",
    sentence: "My father is kind.",
    translation: "Bo toi tot bung.",
  },
  mother: {
    partOfSpeech: "noun",
    sentence: "My mother is a teacher.",
    translation: "Me toi la giao vien.",
  },
  brother: {
    partOfSpeech: "noun",
    sentence: "My brother likes football.",
    translation: "Anh trai toi thich bong da.",
  },
  sister: {
    partOfSpeech: "noun",
    sentence: "My sister reads books.",
    translation: "Chi gai toi doc sach.",
  },
  parent: {
    partOfSpeech: "noun",
    sentence: "A parent takes care of a child.",
    translation: "Cha me cham soc con cai.",
  },
  child: {
    partOfSpeech: "noun",
    sentence: "The child is happy.",
    translation: "Dua tre dang vui.",
  },
  son: {
    partOfSpeech: "noun",
    sentence: "Their son is young.",
    translation: "Con trai cua ho con nho.",
  },
  daughter: {
    partOfSpeech: "noun",
    sentence: "Their daughter is smart.",
    translation: "Con gai cua ho thong minh.",
  },
  husband: {
    partOfSpeech: "noun",
    sentence: "Her husband cooks dinner.",
    translation: "Chong cua co ay nau bua toi.",
  },
};

const GRAMMAR_EXAMPLE_TRANSLATIONS = {
  "she works in a hospital every day":
    "Co ay lam viec o benh vien moi ngay.",
  "i am a student": "Toi la hoc sinh.",
  "they are happy": "Ho dang vui.",
  "they are playing football now": "Ho dang choi bong da bay gio.",
  "i have an apple and the apple is red":
    "Toi co mot qua tao va qua tao do mau do.",
  "he visited hanoi last year": "Anh ay da tham Ha Noi nam ngoai.",
  "she is taller than her brother": "Co ay cao hon anh trai cua co ay.",
};

const POS_WORDS = {
  interjection: new Set([
    "hello",
    "goodbye",
    "thank you",
    "sorry",
    "yes",
    "no",
    "excuse me",
    "welcome",
    "good morning",
  ]),
  determiner: new Set(["my", "your", "his", "her", "our", "their"]),
  pronoun: new Set(["i", "you", "he", "she", "it", "we", "they"]),
  verb: new Set(["am", "are", "is", "meet", "say", "go", "come", "have"]),
  adjective: new Set(["nice", "sorry", "good", "beautiful", "important"]),
  adverb: new Set(["please", "quickly", "slowly", "carefully"]),
  preposition: new Set(["from", "in", "on", "at", "near", "under", "behind"]),
};

class GameService {
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  parseJsonArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  hasAuthoredContent(value) {
    return this.parseJsonArray(value).filter(Boolean).length > 0;
  }

  preferredGameTypeForLesson(lesson, unit) {
    return getDefaultGameTypeForLesson(lesson, unit);
  }

  pickPrimaryGameConfig(games) {
    return pickPrimaryLessonGameConfig(
      games,
      games[0]?.lesson,
      games[0]?.unit
    );
  }

  /** Gửi cho FE khi đang chơi: giữ cấu trúc câu hỏi, bỏ correct_answer (giống startGame). */
  sanitizeQuestionsForClient(questionsData) {
    const questions = this.parseJsonArray(questionsData);
    if (!Array.isArray(questions)) {
      return [];
    }
    return questions.map((q, index) => {
      const questionCopy = { ...q };
      delete questionCopy.correct_answer;
      return {
        index,
        ...questionCopy,
      };
    });
  }

  /** Chuẩn hoá đáp án dạng chữ để so khớp (lowercase, gộp khoảng trắng). */
  normalizeAnswer(value) {
    return String(value ?? "")
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ");
  }

  splitWords(sentence) {
    return String(sentence ?? "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  capitalizeText(value) {
    const text = String(value ?? "").trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
  }

  sentenceCaseWord(value) {
    const text = String(value ?? "").trim();
    if (!text) return text;
    return text.length <= 2 ? text.toLowerCase() : text.toLowerCase();
  }

  articleFor(word) {
    const text = String(word ?? "").trim().toLowerCase();
    return /^[aeiou]/.test(text) && !/^(uni|use|one)/.test(text) ? "an" : "a";
  }

  inferVocabularyPartOfSpeech(vocab) {
    const key = lexemeKey(vocab?.word);
    for (const [partOfSpeech, words] of Object.entries(POS_WORDS)) {
      if (words.has(key)) return partOfSpeech;
    }

    if (key.includes(" ")) return "phrase";
    return "noun";
  }

  getVocabularyUsage(vocab) {
    const word = String(vocab?.word ?? "").trim();
    const key = lexemeKey(word);
    const bankEntry = VOCABULARY_USAGE_BANK[key];

    if (bankEntry) {
      return {
        word,
        partOfSpeech: bankEntry.partOfSpeech,
        sentence: bankEntry.sentence,
        translation: bankEntry.translation,
      };
    }

    const partOfSpeech = this.inferVocabularyPartOfSpeech(vocab);
    const lowerWord = this.sentenceCaseWord(word);
    const meaning = String(vocab?.translation ?? word).trim();
    const article = this.articleFor(word);

    switch (partOfSpeech) {
      case "verb":
        return {
          word,
          partOfSpeech,
          sentence: `I can ${lowerWord} today.`,
          translation: `Toi co the ${meaning} hom nay.`,
        };
      case "adjective":
        return {
          word,
          partOfSpeech,
          sentence: `The lesson is ${lowerWord}.`,
          translation: `Bai hoc thi ${meaning}.`,
        };
      case "adverb":
        return {
          word,
          partOfSpeech,
          sentence: `She speaks ${lowerWord}.`,
          translation: `Co ay noi mot cach ${meaning}.`,
        };
      case "preposition":
        return {
          word,
          partOfSpeech,
          sentence: `The book is ${lowerWord} the table.`,
          translation: `Quyen sach o vi tri ${meaning} cai ban.`,
        };
      case "determiner":
        return {
          word,
          partOfSpeech,
          sentence: `${this.capitalizeText(lowerWord)} answer is correct.`,
          translation: `Cau tra loi ${meaning} la dung.`,
        };
      case "pronoun":
        return {
          word,
          partOfSpeech,
          sentence: `${this.capitalizeText(lowerWord)} can speak English.`,
          translation: `${meaning} co the noi tieng Anh.`,
        };
      case "interjection":
      case "phrase":
        return {
          word,
          partOfSpeech,
          sentence: `${this.capitalizeText(word)}.`,
          translation: `${meaning}.`,
        };
      case "noun":
      default:
        return {
          word,
          partOfSpeech,
          sentence: `This is ${article} ${lowerWord}.`,
          translation: `Day la mot ${meaning}.`,
        };
    }
  }

  getGrammarExampleSentence(grammar) {
    const source = String(
      grammar?.example || grammar?.translation || this.getGrammarAnswer(grammar)
    ).trim();
    if (!source) return this.getGrammarTitle(grammar);

    const match = source.match(/[^.!?]+[.!?]?/);
    return (match?.[0] || source).trim();
  }

  getGrammarExampleTranslation(grammar, sentence) {
    const explicit = String(grammar?.translation || "").trim();
    if (explicit) return explicit;

    return (
      GRAMMAR_EXAMPLE_TRANSLATIONS[lexemeKey(sentence)] ||
      grammar?.explanation ||
      this.getGrammarTitle(grammar)
    );
  }

  splitSentenceAroundTarget(sentence, target) {
    const text = String(sentence ?? "").trim();
    const answer = String(target ?? "").trim();
    if (!text || !answer) {
      return { before: "", missing: answer, after: "" };
    }

    const pattern = new RegExp(`\\b${escapeRegExp(answer)}\\b`, "i");
    const match = text.match(pattern);
    if (!match || match.index === undefined) {
      return { before: "", missing: answer, after: "" };
    }

    return {
      before: text.slice(0, match.index).trim(),
      missing: match[0],
      after: text.slice(match.index + match[0].length).trim(),
    };
  }

  pickBlankWordFromSentence(sentence) {
    const words = this.splitWords(sentence);
    const normalized = words.map((word) => lexemeKey(word));
    const preferred = normalized.findIndex((word) =>
      [
        "am",
        "is",
        "are",
        "was",
        "were",
        "have",
        "has",
        "do",
        "does",
        "work",
        "works",
        "playing",
        "visited",
        "taller",
      ].includes(word)
    );
    if (preferred >= 0) return words[preferred];

    const contentIndex = normalized.findIndex(
      (word) =>
        word &&
        ![
          "a",
          "an",
          "the",
          "i",
          "you",
          "he",
          "she",
          "it",
          "we",
          "they",
          "my",
          "your",
        ].includes(word)
    );
    return words[contentIndex >= 0 ? contentIndex : Math.floor(words.length / 2)] || "";
  }

  /**
   * Build câu hỏi từ nội dung do admin soạn (GameConfig.content).
   * Mỗi loại game có shape riêng, khớp với UI gốc trong client/games.
   * Trả về questions_data đầy đủ (có correct_answer); FE chỉ nhận bản đã sanitize.
   */
  buildQuestionsFromContent(gameType, content, vocabMap = new Map()) {
    const items = Array.isArray(content) ? content.filter(Boolean) : [];
    // Resolve a word's media from the lesson's vocabulary (single source of
    // truth shared by games + practice), falling back to the item's own URL.
    const vocabFor = (word) =>
      word ? vocabMap.get(this.normalizeAnswer(word)) : null;

    switch (gameType) {
      case "galaxy-match":
        return [
          ...new Map(
            items
              .filter((it) => it.word && it.translation)
              .map((it) => [this.normalizeAnswer(it.word), it])
          ).values(),
        ]
          .slice(0, GALAXY_MATCH_PAIR_COUNT)
          .map((it) => {
            const v = vocabFor(it.word);
            return {
              vocab_id: it.vocab_id ?? v?.id ?? null,
              type: "galaxy-match",
              word: it.word,
              translation: it.translation,
              image_url: v?.image_url || it.imageUrl || it.image_url || null,
              question: it.word,
              correct_answer: it.translation,
            };
          });

      case "planetary-order":
        return items
          .filter((it) => it.correctOrder || it.correct_answer)
          .map((it) => {
            const correct = it.correctOrder || it.correct_answer;
            const scrambled = it.words
              ? this.splitWords(it.words)
              : this.shuffleArray(this.splitWords(correct));
            return {
              vocab_id: it.vocab_id ?? null,
              type: "planetary-order",
              words: scrambled,
              question: "Arrange these words to form a correct sentence:",
              question_vi: "Sắp xếp các từ sau thành câu đúng:",
              translation: it.translation || it.question_vi || "",
              correct_answer: correct,
            };
          });

      case "rescue-mission":
        return items
          .filter((it) => it.missingWord)
          .map((it) => {
            const before = it.displayBefore || "";
            const after = it.displayAfter || "";
            return {
              vocab_id: it.vocab_id ?? null,
              type: "rescue-mission",
              display_before: before,
              display_after: after,
              audio_text:
                it.audioText ||
                it.audio_text ||
                `${before} ${it.missingWord} ${after}`.trim() ||
                it.missingWord,
              question: `${before} _____ ${after}`.trim(),
              question_vi: `${before} _____ ${after}`.trim(),
              correct_answer: it.missingWord,
            };
          });

      case "signal-check":
        return items
          .filter((it) => it.prompt && Array.isArray(it.options))
          .map((it) => {
            const correctId = it.correctAnswerId || it.correct_answer || "A";
            const correctOption = it.options.find((o) => o.id === correctId);
            const v = correctOption ? vocabFor(correctOption.text) : null;
            return {
              vocab_id: it.vocab_id ?? v?.id ?? null,
              type: "signal-check",
              qtype: it.type || "vocabulary",
              prompt: it.prompt,
              image_url: v?.image_url || it.imageUrl || it.image_url || null,
              audio_url: v?.audio_url || it.audioUrl || it.audio_url || null,
              audio_text:
                it.audioText ||
                it.audio_text ||
                correctOption?.text ||
                it.prompt,
              options: it.options.map((o) => ({ id: o.id, text: o.text })),
              question: it.prompt,
              question_vi: it.prompt,
              correct_answer: correctId,
            };
          });

      case "voice-command":
        return items
          .filter((it) => it.text)
          .map((it) => ({
            vocab_id: it.vocab_id ?? null,
            type: "voice-command",
            target_text: it.text,
            phonetic: it.ipa || it.phonetic || "",
            translation: it.translation || "",
            question: "Speak the sentence out loud:",
            question_vi: "Đọc câu sau thành tiếng Anh:",
            correct_answer: it.text,
          }));

      default:
        throw new Error(`Unknown game type: ${gameType}`);
    }
  }

  async generateQuestions(gameConfig, vocabulary) {
    const { game_type, questions_count } = gameConfig;
    const targetCount =
      game_type === "galaxy-match"
        ? Math.min(GALAXY_MATCH_PAIR_COUNT, questions_count)
        : questions_count;

    const selectedVocab = this.shuffleArray(vocabulary).slice(
      0,
      targetCount
    );

    const questions = [];

    for (let i = 0; i < selectedVocab.length; i++) {
      const vocab = selectedVocab[i];

      switch (game_type) {
        case "galaxy-match":
          questions.push(this.generateGalaxyMatchQuestion(vocab));
          break;

        case "planetary-order":
          questions.push(this.generatePlanetaryOrderQuestion(vocab));
          break;

        case "rescue-mission":
          questions.push(this.generateRescueMissionQuestion(vocab));
          break;

        case "signal-check":
          questions.push(this.generateSignalCheckQuestion(vocab, vocabulary));
          break;

        case "voice-command":
          questions.push(this.generateVoiceCommandQuestion(vocab));
          break;

        default:
          throw new Error(`Unknown game type: ${game_type}`);
      }
    }

    return questions;
  }

  generateGalaxyMatchQuestion(vocab) {
    return {
      vocab_id: vocab.id,
      type: "galaxy-match",
      word: vocab.word,
      translation: vocab.translation,
      image_url: vocab.image_url || null,
      question: vocab.word,
      correct_answer: vocab.translation,
    };
  }

  generatePlanetaryOrderQuestion(vocab) {
    const usage = this.getVocabularyUsage(vocab);
    const sentence = usage.sentence;
    const shuffledWords = this.shuffleArray(this.splitWords(sentence));

    return {
      vocab_id: vocab.id,
      type: "planetary-order",
      words: shuffledWords,
      question: "Arrange these words to form a correct sentence:",
      question_vi: "Sắp xếp các từ sau thành câu đúng:",
      translation: usage.translation,
      correct_answer: sentence,
    };
  }

  generateRescueMissionQuestion(vocab) {
    const usage = this.getVocabularyUsage(vocab);
    const singleWordListening =
      ["interjection", "phrase"].includes(usage.partOfSpeech) &&
      this.splitWords(usage.word).length <= 2;
    const blank = singleWordListening
      ? { before: "", missing: usage.word, after: "" }
      : this.splitSentenceAroundTarget(usage.sentence, usage.word);
    const question = `${blank.before} _____ ${blank.after}`.trim() || "_____";

    return {
      vocab_id: vocab.id,
      type: "rescue-mission",
      display_before: blank.before,
      display_after: blank.after,
      audio_text: singleWordListening ? usage.word : usage.sentence,
      question,
      question_vi: usage.translation,
      correct_answer: blank.missing,
    };
  }

  generateSignalCheckQuestion(vocab, allVocabulary) {
    const wrongWords = this.shuffleArray(allVocabulary)
      .filter((v) => v.id !== vocab.id)
      .map((v) => v.word)
      .filter(Boolean)
      .slice(0, 2);

    while (wrongWords.length < 2) {
      wrongWords.push(
        wrongWords.length === 0 ? "Different word" : "Another answer"
      );
    }

    const options = this.shuffleArray([vocab.word, ...wrongWords])
      .slice(0, 3)
      .map((text, idx) => ({ id: ["A", "B", "C"][idx], text }));

    const correctOption = options.find((o) => o.text === vocab.word);

    return {
      vocab_id: vocab.id,
      type: "signal-check",
      qtype: "vocabulary",
      prompt: "Nghe và chọn từ đúng:",
      image_url: vocab.image_url || null,
      audio_url: vocab.audio_url || null,
      audio_text: vocab.word,
      options: options,
      question: "Listen and choose the correct word:",
      question_vi: "Nghe và chọn từ đúng:",
      translation: vocab.translation,
      phonetic: vocab.phonetic,
      correct_answer: correctOption ? correctOption.id : "A",
    };
  }

  generateVoiceCommandQuestion(vocab) {
    const usage = this.getVocabularyUsage(vocab);
    const sentence = usage.sentence;

    return {
      vocab_id: vocab.id,
      type: "voice-command",
      target_text: sentence,
      phonetic: vocab.phonetic || "",
      translation: usage.translation,
      question: "Speak the sentence out loud:",
      question_vi: "Đọc câu sau thành tiếng Anh:",
      correct_answer: sentence,
    };
  }

  getGrammarTitle(grammar) {
    return (
      grammar.name ||
      grammar.pattern ||
      grammar.formula ||
      grammar.grammar_type ||
      "Grammar pattern"
    );
  }

  getGrammarAnswer(grammar) {
    return (
      grammar.formula ||
      grammar.pattern ||
      grammar.example ||
      grammar.explanation ||
      this.getGrammarTitle(grammar)
    );
  }

  generateGrammarQuestions(gameConfig, grammarItems) {
    const { game_type, questions_count } = gameConfig;
    const targetCount =
      game_type === "galaxy-match"
        ? Math.min(GALAXY_MATCH_PAIR_COUNT, questions_count)
        : questions_count;
    const selectedGrammar = this.shuffleArray(grammarItems).slice(
      0,
      targetCount
    );

    return selectedGrammar.map((grammar) => {
      switch (game_type) {
        case "galaxy-match":
          return this.generateGalaxyMatchGrammarQuestion(grammar);
        case "planetary-order":
          return this.generatePlanetaryOrderGrammarQuestion(grammar);
        case "rescue-mission":
          return this.generateRescueMissionGrammarQuestion(grammar);
        case "signal-check":
          return this.generateSignalCheckGrammarQuestion(grammar, grammarItems);
        case "voice-command":
          return this.generateVoiceCommandGrammarQuestion(grammar);
        default:
          throw new Error(`Unknown game type: ${game_type}`);
      }
    });
  }

  generateMixedSignalCheckQuestions(gameConfig, vocabulary, grammarItems) {
    const total = Math.max(1, Number(gameConfig.questions_count) || 1);
    const hasVocabulary = vocabulary.length > 0;
    const hasGrammar = grammarItems.length > 0;

    if (!hasVocabulary) {
      return this.generateGrammarQuestions(gameConfig, grammarItems);
    }
    if (!hasGrammar) {
      return this.generateQuestions(gameConfig, vocabulary);
    }

    const grammarTarget = Math.min(
      grammarItems.length,
      Math.max(1, Math.round(total * 0.35))
    );
    const vocabTarget = Math.min(vocabulary.length, total - grammarTarget);
    const remaining = total - vocabTarget - grammarTarget;

    const shuffledVocabulary = this.shuffleArray(vocabulary);
    const shuffledGrammar = this.shuffleArray(grammarItems);
    const selectedVocabulary = shuffledVocabulary.slice(
      0,
      vocabTarget + Math.max(0, remaining)
    );
    const selectedGrammar = shuffledGrammar.slice(0, grammarTarget);

    const questions = [
      ...selectedVocabulary.map((vocab) =>
        this.generateSignalCheckQuestion(vocab, vocabulary)
      ),
      ...selectedGrammar.map((grammar) =>
        this.generateSignalCheckGrammarQuestion(grammar, grammarItems)
      ),
    ];

    if (questions.length < total) {
      const usedVocabIds = new Set(selectedVocabulary.map((vocab) => vocab.id));
      const usedGrammarIds = new Set(
        selectedGrammar.map((grammar) => grammar.id)
      );
      for (const vocab of shuffledVocabulary) {
        if (questions.length >= total) break;
        if (usedVocabIds.has(vocab.id)) continue;
        usedVocabIds.add(vocab.id);
        questions.push(this.generateSignalCheckQuestion(vocab, vocabulary));
      }
      for (const grammar of shuffledGrammar) {
        if (questions.length >= total) break;
        if (usedGrammarIds.has(grammar.id)) continue;
        usedGrammarIds.add(grammar.id);
        questions.push(
          this.generateSignalCheckGrammarQuestion(grammar, grammarItems)
        );
      }
    }

    return this.shuffleArray(questions).slice(0, total);
  }

  generateGalaxyMatchGrammarQuestion(grammar) {
    const title = this.getGrammarTitle(grammar);
    const answer = this.getGrammarAnswer(grammar);

    return {
      vocab_id: null,
      grammar_id: grammar.id,
      type: "galaxy-match",
      word: title,
      translation: answer,
      image_url: null,
      question: title,
      correct_answer: answer,
    };
  }

  generatePlanetaryOrderGrammarQuestion(grammar) {
    const sentence = this.getGrammarExampleSentence(grammar);

    return {
      vocab_id: null,
      grammar_id: grammar.id,
      type: "planetary-order",
      words: this.shuffleArray(this.splitWords(sentence)),
      question: "Arrange these words to form a correct grammar example:",
      question_vi: "Sap xep cac tu sau thanh vi du ngu phap dung:",
      translation: this.getGrammarExampleTranslation(grammar, sentence),
      correct_answer: sentence,
    };
  }

  generateRescueMissionGrammarQuestion(grammar) {
    const source = this.getGrammarExampleSentence(grammar);
    const missingWord =
      this.pickBlankWordFromSentence(source) || this.getGrammarTitle(grammar);
    const blank = this.splitSentenceAroundTarget(source, missingWord);
    const question = `${blank.before} _____ ${blank.after}`.trim() || "_____";

    return {
      vocab_id: null,
      grammar_id: grammar.id,
      type: "rescue-mission",
      display_before: blank.before,
      display_after: blank.after,
      audio_text: source,
      question,
      question_vi: this.getGrammarExampleTranslation(grammar, source),
      correct_answer: blank.missing || missingWord,
    };
  }

  generateSignalCheckGrammarQuestion(grammar, allGrammar) {
    const answer = this.getGrammarAnswer(grammar);
    const wrongAnswers = this.shuffleArray(
      allGrammar
        .filter((g) => g.id !== grammar.id)
        .map((g) => this.getGrammarAnswer(g))
        .filter((text) => text && text !== answer)
    ).slice(0, 2);

    while (wrongAnswers.length < 2) {
      wrongAnswers.push(
        wrongAnswers.length === 0
          ? "Different structure"
          : "Not used for this pattern"
      );
    }

    const options = this.shuffleArray([answer, ...wrongAnswers])
      .slice(0, 3)
      .map((text, idx) => ({ id: ["A", "B", "C"][idx], text }));
    const correctOption = options.find((o) => o.text === answer);

    return {
      vocab_id: null,
      grammar_id: grammar.id,
      type: "signal-check",
      qtype: "grammar",
      prompt: `Choose the correct formula for ${this.getGrammarTitle(grammar)}:`,
      image_url: null,
      audio_url: null,
      options,
      question: `Choose the correct formula for ${this.getGrammarTitle(grammar)}:`,
      question_vi: `Chon cong thuc dung cho ${this.getGrammarTitle(grammar)}:`,
      correct_answer: correctOption ? correctOption.id : "A",
    };
  }

  generateVoiceCommandGrammarQuestion(grammar) {
    const target = this.getGrammarExampleSentence(grammar);

    return {
      vocab_id: null,
      grammar_id: grammar.id,
      type: "voice-command",
      target_text: target,
      phonetic: "",
      translation: this.getGrammarExampleTranslation(grammar, target),
      question: "Speak the grammar example out loud:",
      question_vi: "Doc vi du ngu phap sau thanh tieng Anh:",
      correct_answer: target,
    };
  }

  async getGameTypes() {
    return [
      {
        type: "galaxy-match",
        name: "Galaxy Match",
        description: "Match English words with Vietnamese translations",
        icon: "🌌",
        difficulty: "easy",
      },
      {
        type: "planetary-order",
        name: "Planetary Order",
        description: "Arrange words to form correct sentences",
        icon: "🪐",
        difficulty: "medium",
      },
      {
        type: "rescue-mission",
        name: "Rescue Mission",
        description: "Choose the correct word to complete sentences",
        icon: "🚀",
        difficulty: "medium",
      },
      {
        type: "signal-check",
        name: "Signal Check",
        description: "Listen and choose the correct word",
        icon: "📡",
        difficulty: "hard",
      },
      {
        type: "voice-command",
        name: "Voice Command",
        description: "Speak English sentences out loud",
        icon: "🎤",
        difficulty: "medium",
      },
    ];
  }

  async getGamesByLesson(lessonId, userId) {
    const games = await GameConfig.findAll({
      where: { lesson_id: lessonId },
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "title", "icon", "order_index"],
        },
        {
          model: Lesson,
          as: "lesson",
          attributes: ["id", "title", "type", "order_index"],
        },
      ],
      order: [
        ["updated_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    const primaryGame = this.pickPrimaryGameConfig(games);
    const selectedGames =
      primaryGame &&
      isGameTypeAllowedForLesson(primaryGame.lesson, primaryGame.game_type)
        ? [primaryGame]
        : [];
    if (selectedGames.length === 0) {
      return [];
    }

    const gameConfigIds = selectedGames.map((g) => g.id);
    const bestSessions = await GameSession.findAll({
      where: {
        user_id: userId,
        game_config_id: { [Op.in]: gameConfigIds },
        status: "completed",
      },
      attributes: [
        "game_config_id",
        [
          require("sequelize").fn("MAX", require("sequelize").col("score")),
          "best_score",
        ],
        [
          require("sequelize").fn("MAX", require("sequelize").col("xp_earned")),
          "best_xp",
        ],
      ],
      group: ["game_config_id"],
    });

    return selectedGames.map((game) => {
      const gameData = game.toJSON();
      const bestSession = bestSessions.find(
        (s) => s.game_config_id === game.id
      );

      gameData.user_best = bestSession
        ? {
            score: bestSession.dataValues.best_score,
            xp: bestSession.dataValues.best_xp,
          }
        : null;

      return gameData;
    });
  }

  async startGame(gameConfigId, userId) {
    const gameConfig = await GameConfig.findByPk(gameConfigId, {
      include: [
        {
          model: Lesson,
          as: "lesson",
        },
        {
          model: Unit,
          as: "unit",
        },
      ],
    });

    if (!gameConfig) {
      throw new Error("Game configuration not found");
    }

    if (
      gameConfig.lesson &&
      !isGameTypeAllowedForLesson(gameConfig.lesson, gameConfig.game_type)
    ) {
      throw new Error(
        `Game type ${gameConfig.game_type} is not allowed for this lesson`
      );
    }

    let questions;
    const authored = this.parseJsonArray(gameConfig.content);
    const fallbackUnitId = gameConfig.unit_id || gameConfig.lesson?.unit_id;

    if (authored.length > 0) {
      // Ưu tiên nội dung do admin soạn (giữ đúng luồng game gốc).
      // Lấy ảnh/audio từ vocabulary của lesson (nguồn dùng chung cho games + practice).
      const lessonVocab = await Vocabulary.findAll({
        where: fallbackUnitId
          ? { unit_id: fallbackUnitId }
          : { lesson_id: gameConfig.lesson_id },
        attributes: ["id", "word", "image_url", "audio_url"],
      });
      const vocabMap = new Map();
      for (const v of lessonVocab) {
        vocabMap.set(this.normalizeAnswer(v.word), {
          id: v.id,
          image_url: v.image_url,
          audio_url: v.audio_url,
        });
      }
      questions = this.buildQuestionsFromContent(
        gameConfig.game_type,
        authored,
        vocabMap
      );
      if (questions.length === 0) {
        throw new Error("Game content is empty or invalid");
      }
    } else {
      // Fallback: tự sinh từ vocabulary của lesson.
      const lessonVocabulary = gameConfig.lesson_id
        ? await Vocabulary.findAll({
            where: { lesson_id: gameConfig.lesson_id },
          })
        : [];
      const unitVocabulary =
        lessonVocabulary.length === 0 && fallbackUnitId
          ? await Vocabulary.findAll({ where: { unit_id: fallbackUnitId } })
          : [];
      const vocabulary =
        lessonVocabulary.length > 0 ? lessonVocabulary : unitVocabulary;

      const shouldLoadGrammar =
        gameConfig.game_type === "signal-check" ||
        gameConfig.lesson?.type === "grammar" ||
        vocabulary.length === 0;
      const shouldPreferGrammar =
        gameConfig.lesson?.type === "grammar" || vocabulary.length === 0;
      const lessonGrammar =
        shouldLoadGrammar && gameConfig.lesson_id
          ? await Grammar.findAll({
              where: { lesson_id: gameConfig.lesson_id },
              order: [["order_index", "ASC"]],
            })
          : [];
      const unitGrammar =
        shouldLoadGrammar && lessonGrammar.length === 0 && fallbackUnitId
          ? await Grammar.findAll({
              where: { unit_id: fallbackUnitId },
              order: [
                ["lesson_id", "ASC"],
                ["order_index", "ASC"],
              ],
            })
          : [];
      const grammar = lessonGrammar.length > 0 ? lessonGrammar : unitGrammar;

      if (gameConfig.game_type === "signal-check" && grammar.length > 0) {
        questions = this.generateMixedSignalCheckQuestions(
          gameConfig,
          vocabulary,
          grammar
        );
      } else if (shouldPreferGrammar && grammar.length > 0) {
        questions = this.generateGrammarQuestions(gameConfig, grammar);
      } else if (vocabulary.length > 0) {
        questions = await this.generateQuestions(gameConfig, vocabulary);
      } else if (grammar.length > 0) {
        questions = this.generateGrammarQuestions(gameConfig, grammar);
      } else {
        throw new Error("No vocabulary or grammar content found for this lesson");
      }

      if (questions.length === 0) {
        throw new Error("Game content is empty or invalid");
      }
    }

    const session = await GameSession.create({
      user_id: userId,
      game_config_id: gameConfigId,
      status: "in-progress",
      total_questions: questions.length,
      questions_data: questions,
    });

    const sessionData = session.toJSON();

    sessionData.questions = this.sanitizeQuestionsForClient(
      sessionData.questions_data
    );

    delete sessionData.questions_data;

    return {
      session_id: session.id,
      game_type: gameConfig.game_type,
      questions_count: questions.length,
      time_limit: gameConfig.time_limit,
      passing_score: gameConfig.passing_score,
      questions: sessionData.questions,
      started_at: session.started_at,
    };
  }
  async submitAnswer(sessionId, userId, answerData) {
    const { question_index, answer } = answerData;

    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "in-progress") {
      throw new Error("Game session is not active");
    }

    const questions = this.parseJsonArray(session.questions_data);

    if (question_index < 0 || question_index >= questions.length) {
      throw new Error("Invalid question index");
    }

    const question = questions[question_index];

    if (question.user_answer !== undefined) {
      throw new Error("Question already answered");
    }

    let isCorrect;
    if (question.type === "voice-command") {
      // Voice command: answer is "pass" or "fail" string from FE
      // FE calculates similarity, maps >=50% -> "pass", <50% -> "fail"
      isCorrect = answer === "pass";
    } else {
      isCorrect =
        this.normalizeAnswer(answer) ===
        this.normalizeAnswer(question.correct_answer);
    }

    questions[question_index] = {
      ...question,
      user_answer: answer,
      is_correct: isCorrect,
      answered_at: new Date(),
    };

    const correctCount = questions.filter((q) => q.is_correct === true).length;

    if (!isCorrect) {
      await GameWrongAnswer.create({
        game_session_id: sessionId,
        question_id: `q-${question_index}`,
        prompt: question.question,
        user_answer: answer,
        correct_answer: question.correct_answer,
      });
    }

    await session.update({
      questions_data: questions,
      correct_answers: correctCount,
    });

    return {
      question_index: question_index,
      is_correct: isCorrect,
      correct_answer: isCorrect ? null : question.correct_answer,
      current_score: Math.round((correctCount / questions.length) * 100),
      answered_count: questions.filter((q) => q.user_answer !== undefined)
        .length,
      total_questions: questions.length,
    };
  }

  async completeGame(sessionId, userId, completionData = {}) {
    const { time_spent = 0 } = completionData;

    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
      include: [
        {
          model: GameConfig,
          as: "config",
        },
      ],
    });

    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "in-progress") {
      throw new Error("Game session is not active");
    }

    const questions = this.parseJsonArray(session.questions_data);
    const answeredQuestions = questions.filter(
      (q) => q.user_answer !== undefined
    );
    const correctCount = questions.filter((q) => q.is_correct === true).length;

    const score = Math.round((correctCount / session.total_questions) * 100);
    const isPassed = score >= session.config.passing_score;

    let xpEarned = 0;
    if (isPassed) {
      xpEarned = session.config.xp_reward;

      if (score === 100) {
        xpEarned = Math.round(xpEarned * 1.5);
      } else if (score >= 90) {
        xpEarned = Math.round(xpEarned * 1.2);
      }
    }

    await session.update({
      status: "completed",
      score: score,
      correct_answers: correctCount,
      time_spent: time_spent,
      xp_earned: xpEarned,
      completed_at: new Date(),
    });

    if (isPassed && xpEarned > 0) {
      await userService.addXP(userId, xpEarned);
    }
    await this.updateLearningProgressAfterGame({
      session,
      userId,
      isPassed,
      score,
      correctCount,
      timeSpent: time_spent,
      xpEarned,
    });

    return {
      session_id: sessionId,
      status: "completed",
      score: score,
      correct_answers: correctCount,
      total_questions: session.total_questions,
      accuracy: score,
      passed: isPassed,
      passing_score: session.config.passing_score,
      xp_earned: xpEarned,
      time_spent: time_spent,
      message: isPassed
        ? `Congratulations! You earned ${xpEarned} XP!`
        : `Keep practicing! You need ${session.config.passing_score}% to pass.`,
    };
  }

  calculateStars(score) {
    if (score >= 90) return 3;
    if (score >= 70) return 2;
    if (score >= 50) return 1;
    return 0;
  }

  async updateLearningProgressAfterGame({ session, userId, isPassed, score, correctCount, timeSpent, xpEarned }) {
    const studyMinutes = Math.max(0, Math.ceil(Number(timeSpent || 0) / 60));
    const [userProgress] = await UserProgress.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });

    if (studyMinutes > 0) {
      userProgress.total_study_minutes = (userProgress.total_study_minutes || 0) + studyMinutes;
      await missionService.updateProgress(userId, "daily-goal", studyMinutes);
    }

    const lesson = session.config?.lesson_id ? await Lesson.findByPk(session.config.lesson_id) : null;
    if (lesson?.type === "test" || Number(lesson?.order_index) === 5) {
      await missionService.updateProgress(userId, "test-participation", 1);
    }

    if (!isPassed || !session.config?.lesson_id) {
      await userProgress.save();
      return;
    }

    const unitId = session.config.unit_id || lesson?.unit_id;

    if (!unitId) {
      await userProgress.save();
      return;
    }

    const [lessonProgress] = await LessonProgress.findOrCreate({
      where: {
        user_id: userId,
        lesson_id: session.config.lesson_id,
      },
      defaults: {
        user_id: userId,
        unit_id: unitId,
        lesson_id: session.config.lesson_id,
        status: "in-progress",
      },
    });

    const isReview = lessonProgress.status === "completed";
    const totalLessons = await Lesson.count({ where: { unit_id: unitId } });
    const completedLessonsBefore = unitId
      ? await LessonProgress.count({
          where: {
            user_id: userId,
            unit_id: unitId,
            status: "completed",
          },
        })
      : 0;

    await lessonProgress.update({
      status: "completed",
      stars_earned: this.calculateStars(score),
      is_review: isReview,
      xp_earned: xpEarned,
      correct_count: correctCount,
      total_count: session.total_questions,
      completed_at: new Date(),
      first_completed_at: lessonProgress.first_completed_at || new Date(),
    });

    // Save the lesson's vocabulary into the user's learned list (practice/vocabulary).
    await vocabularyService.enrollLessonVocabulary(userId, session.config.lesson_id);

    if (!isReview) {
      userProgress.lessons_completed = (userProgress.lessons_completed || 0) + 1;
      await missionService.updateProgress(userId, "new-lesson", 1);

      if (totalLessons > 0 && completedLessonsBefore + 1 >= totalLessons) {
        userProgress.units_completed = (userProgress.units_completed || 0) + 1;
        await missionService.updateProgress(userId, "new-level", 1);
      }
    } else {
      await missionService.updateProgress(userId, "review-lesson", 1);
    }

    await userProgress.save();
  }

  async getGameResults(sessionId, userId) {
    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
      include: [
        {
          model: GameConfig,
          as: "config",
          include: [
            {
              model: Lesson,
              as: "lesson",
              attributes: ["id", "title", "type"],
            },
            {
              model: Unit,
              as: "unit",
              attributes: ["id", "title", "icon"],
            },
          ],
        },
        {
          model: GameWrongAnswer,
          as: "wrongAnswers",
        },
      ],
    });

    if (!session) {
      throw new Error("Game session not found");
    }

    const sessionData = session.toJSON();
    const config = sessionData.config;
    const questions = this.parseJsonArray(session.questions_data);

    return {
      session_id: session.id,
      game_type: config?.game_type || "unknown",
      status: session.status,
      score: session.score,
      correct_answers: session.correct_answers,
      total_questions: session.total_questions,
      accuracy: session.score,
      passed: config ? session.score >= config.passing_score : false,
      passing_score: config?.passing_score || 70,
      xp_earned: session.xp_earned,
      time_spent: session.time_spent,
      started_at: session.started_at,
      completed_at: session.completed_at,
      lesson: config?.lesson,
      unit: config?.unit,
      wrong_answers_count: sessionData.wrongAnswers?.length || 0,
      questions:
        session.status === "completed"
          ? questions
          : this.sanitizeQuestionsForClient(questions),
    };
  }

  async getWrongAnswers(sessionId, userId) {
    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      throw new Error("Game session not found");
    }

    const wrongAnswers = await GameWrongAnswer.findAll({
      where: { game_session_id: sessionId },
      order: [["created_at", "ASC"]],
    });

    return wrongAnswers.map((wa) => ({
      id: wa.id,
      question: wa.prompt,
      user_answer: wa.user_answer,
      correct_answer: wa.correct_answer,
    }));
  }

  async getGameHistory(userId, filters = {}) {
    const { game_type, limit = 20, page = 1 } = filters;

    const where = {
      user_id: userId,
      status: "completed",
    };

    const offset = (page - 1) * limit;

    const { count, rows } = await GameSession.findAndCountAll({
      where,
      include: [
        {
          model: GameConfig,
          as: "config",
          where: game_type ? { game_type } : {},
          include: [
            {
              model: Lesson,
              as: "lesson",
              attributes: ["id", "title"],
            },
            {
              model: Unit,
              as: "unit",
              attributes: ["id", "title", "icon"],
            },
          ],
        },
      ],
      order: [["completed_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      sessions: rows.map((session) => ({
        session_id: session.id,
        game_type: session.config.game_type,
        score: session.score,
        xp_earned: session.xp_earned,
        passed: session.score >= session.config.passing_score,
        completed_at: session.completed_at,
        lesson: session.config.lesson,
        unit: session.config.unit,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getGameStatistics(userId) {
    const totalGames = await GameSession.count({
      where: {
        user_id: userId,
        status: "completed",
      },
    });

    const gamesByType = await GameSession.findAll({
      where: {
        user_id: userId,
        status: "completed",
      },
      include: [
        {
          model: GameConfig,
          as: "config",
          attributes: ["game_type"],
        },
      ],
      attributes: [
        [
          require("sequelize").fn(
            "COUNT",
            require("sequelize").col("GameSession.id")
          ),
          "count",
        ],
        [
          require("sequelize").fn("AVG", require("sequelize").col("score")),
          "avg_score",
        ],
        [
          require("sequelize").fn("SUM", require("sequelize").col("xp_earned")),
          "total_xp",
        ],
      ],
      group: ["config.game_type"],
      raw: true,
    });

    const overallStats = await GameSession.findOne({
      where: {
        user_id: userId,
        status: "completed",
      },
      attributes: [
        [
          require("sequelize").fn("AVG", require("sequelize").col("score")),
          "avg_score",
        ],
        [
          require("sequelize").fn("MAX", require("sequelize").col("score")),
          "best_score",
        ],
        [
          require("sequelize").fn("SUM", require("sequelize").col("xp_earned")),
          "total_xp",
        ],
        [
          require("sequelize").fn(
            "SUM",
            require("sequelize").col("correct_answers")
          ),
          "total_correct",
        ],
        [
          require("sequelize").fn(
            "SUM",
            require("sequelize").col("total_questions")
          ),
          "total_questions",
        ],
      ],
      raw: true,
    });

    const gamesPassed = await GameSession.count({
      where: {
        user_id: userId,
        status: "completed",
        score: { [Op.gte]: require("sequelize").col("config.passing_score") },
      },
      include: [
        {
          model: GameConfig,
          as: "config",
          attributes: [],
        },
      ],
    });

    const perfectScores = await GameSession.count({
      where: {
        user_id: userId,
        status: "completed",
        score: 100,
      },
    });

    return {
      total_games: totalGames,
      games_passed: gamesPassed,
      games_failed: totalGames - gamesPassed,
      pass_rate:
        totalGames > 0 ? Math.round((gamesPassed / totalGames) * 100) : 0,
      perfect_scores: perfectScores,
      average_score: overallStats ? Math.round(overallStats.avg_score) : 0,
      best_score: overallStats ? overallStats.best_score : 0,
      total_xp_earned: overallStats ? overallStats.total_xp || 0 : 0,
      total_correct: overallStats ? overallStats.total_correct || 0 : 0,
      total_questions: overallStats ? overallStats.total_questions || 0 : 0,
      accuracy:
        overallStats && overallStats.total_questions > 0
          ? Math.round(
              (overallStats.total_correct / overallStats.total_questions) * 100
            )
          : 0,
      by_game_type: gamesByType.map((stat) => ({
        game_type: stat["config.game_type"],
        games_played: stat.count,
        average_score: Math.round(stat.avg_score),
        total_xp: stat.total_xp || 0,
      })),
    };
  }

  async replayGame(gameConfigId, userId) {
    return await this.startGame(gameConfigId, userId);
  }
  async abandonGame(sessionId, userId) {
    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
        status: "in-progress",
      },
    });

    if (!session) {
      throw new Error("Active game session not found");
    }

    await session.update({
      status: "abandoned",
      completed_at: new Date(),
    });

    return {
      message: "Game abandoned",
      session_id: sessionId,
    };
  }
}

module.exports = new GameService();
