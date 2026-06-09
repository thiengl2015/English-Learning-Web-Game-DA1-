require("dotenv").config({ path: "./.env.test", override: true });

describe("ChallengeService - checkAnswer", () => {
  let challengeService;

  beforeAll(() => {
    challengeService = require("../src/services/challenge.service");
  });

  test("match: accepts the correct selected letter", () => {
    expect(
      challengeService.checkAnswer("match", { selected: "a" }, { selected: "A" })
    ).toBe(true);
    expect(
      challengeService.checkAnswer("match", { selected: "B" }, { selected: "A" })
    ).toBe(false);
  });

  test("listen_write: requires both picture choice and written word", () => {
    const correct = { selected: "B", written: "rainy" };
    expect(
      challengeService.checkAnswer(
        "listen_write",
        { selected: "B", written: "Rainy" },
        correct
      )
    ).toBe(true);
    expect(
      challengeService.checkAnswer(
        "listen_write",
        { selected: "B", written: "sunny" },
        correct
      )
    ).toBe(false);
  });

  test("fill_blank: scores single blank answers case-insensitively", () => {
    expect(
      challengeService.checkAnswer("fill_blank", { answer: "Hello" }, { answer: "hello" })
    ).toBe(true);
    expect(
      challengeService.checkAnswer("fill_blank", { answer: "bye" }, { answer: "hello" })
    ).toBe(false);
  });

  test("listen_repeat: compares transcript to the expected word", () => {
    expect(
      challengeService.checkAnswer(
        "listen_repeat",
        { transcript: "computer" },
        { answer: "Computer" }
      )
    ).toBe(true);
    expect(
      challengeService.checkAnswer(
        "listen_repeat",
        { transcript: "phone" },
        { answer: "computer" }
      )
    ).toBe(false);
  });
});
