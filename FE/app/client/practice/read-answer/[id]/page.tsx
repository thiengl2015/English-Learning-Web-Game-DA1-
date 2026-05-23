"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react"
import { SpaceBackground } from "@/components/space-background"

// ─── Data ─────────────────────────────────────────────────────────────────────
interface Question {
  id: number
  statement: string
  answer: boolean // correct answer
}

interface Part {
  id: number
  passage: string
  image?: string
  questions: Question[]
}

interface TopicData {
  title: string
  parts: Part[]
}

const TOPIC_DATA: Record<string, TopicData> = {
  greetings: {
    title: "Greetings",
    parts: [
      {
        id: 1,
        passage:
          "Hello! My name is Tom. I am eight years old. I go to school every day. I like to say hello to my friends. I always say thank you when someone helps me.",
        questions: [
          { id: 1, statement: "Tom is ten years old.", answer: false },
          { id: 2, statement: "Tom goes to school every day.", answer: true },
          { id: 3, statement: "Tom says thank you to his friends.", answer: false },
        ],
      },
      {
        id: 2,
        passage:
          "Good morning! Anna wakes up at seven o'clock. She says good morning to her mum and dad. She eats breakfast and goes to school. She says goodbye before she leaves.",
        questions: [
          { id: 1, statement: "Anna wakes up at eight o'clock.", answer: false },
          { id: 2, statement: "Anna says good morning to her parents.", answer: true },
          { id: 3, statement: "Anna says goodbye before she leaves.", answer: true },
        ],
      },
      {
        id: 3,
        passage:
          "Please and sorry are important words. If you want something, say please. If you make a mistake, say sorry. These words make people feel good.",
        questions: [
          { id: 1, statement: "Please and sorry are not important.", answer: false },
          { id: 2, statement: "You say please when you want something.", answer: true },
          { id: 3, statement: "Sorry makes people feel good.", answer: true },
        ],
      },
      {
        id: 4,
        passage:
          "Welcome to our school! We are happy you are here. You will meet many friends. Everyone is kind and polite. We greet each other every morning.",
        questions: [
          { id: 1, statement: "The students are not happy.", answer: false },
          { id: 2, statement: "Students greet each other every morning.", answer: true },
          { id: 3, statement: "Everyone is kind and polite.", answer: true },
        ],
      },
    ],
  },
  "daily-activities": {
    title: "Daily Activities",
    parts: [
      {
        id: 1,
        passage:
          "It is eight o'clock in the morning. Anna is going out with her friends. It's spring. She loves the weather. It's warm. Anna likes autumn, too. It is cool. She can go to the zoo with her parents. Anna doesn't like winter. It is cold and snowy.",
        questions: [
          { id: 1, statement: "Anna is going out at nine o'clock.", answer: false },
          { id: 2, statement: "Anna doesn't like autumn.", answer: false },
          { id: 3, statement: "Anna loves spring.", answer: true },
        ],
      },
      {
        id: 2,
        passage:
          "Ben rides his bike every afternoon. He puts on his helmet before riding. He goes to the park near his house. Sometimes his dog runs next to him. Ben loves riding his bike.",
        questions: [
          { id: 1, statement: "Ben rides his bike every morning.", answer: false },
          { id: 2, statement: "Ben wears a helmet when riding.", answer: true },
          { id: 3, statement: "Ben's dog sometimes runs with him.", answer: true },
        ],
      },
      {
        id: 3,
        passage:
          "Lucy likes cooking with her mother. They cook dinner together on Saturdays. Lucy can make pasta and soup. Her father says her soup is delicious. Lucy feels happy when people enjoy her food.",
        questions: [
          { id: 1, statement: "Lucy cooks with her father.", answer: false },
          { id: 2, statement: "They cook together on Saturdays.", answer: true },
          { id: 3, statement: "Lucy's father likes her soup.", answer: true },
        ],
      },
      {
        id: 4,
        passage:
          "Sam goes to bed at nine o'clock. He brushes his teeth and reads a book. His mum turns off the light. Sam sleeps for eight hours. He wakes up feeling fresh and ready for school.",
        questions: [
          { id: 1, statement: "Sam goes to bed at ten o'clock.", answer: false },
          { id: 2, statement: "Sam reads a book before sleeping.", answer: true },
          { id: 3, statement: "Sam sleeps for eight hours.", answer: true },
        ],
      },
    ],
  },
  animals: {
    title: "Animals",
    parts: [
      {
        id: 1,
        passage:
          "Dogs are great pets. They are friendly and loyal. Dogs love to play and run outside. They need food and water every day. Dogs can also learn many tricks. They are a human's best friend.",
        questions: [
          { id: 1, statement: "Dogs are not friendly.", answer: false },
          { id: 2, statement: "Dogs need food and water every day.", answer: true },
          { id: 3, statement: "Dogs can learn tricks.", answer: true },
        ],
      },
      {
        id: 2,
        passage:
          "Cats are quiet animals. They sleep a lot during the day. Cats like to play with toys. They clean themselves by licking their fur. Cats purr when they are happy.",
        questions: [
          { id: 1, statement: "Cats are very noisy animals.", answer: false },
          { id: 2, statement: "Cats clean themselves by licking their fur.", answer: true },
          { id: 3, statement: "Cats purr when they are happy.", answer: true },
        ],
      },
      {
        id: 3,
        passage:
          "Elephants are the biggest land animals. They live in Africa and Asia. Elephants use their trunks to pick up food and drink water. Baby elephants stay close to their mothers.",
        questions: [
          { id: 1, statement: "Elephants are small animals.", answer: false },
          { id: 2, statement: "Elephants use their trunks to drink water.", answer: true },
          { id: 3, statement: "Baby elephants stay close to their mothers.", answer: true },
        ],
      },
      {
        id: 4,
        passage:
          "Rabbits are soft and cute animals. They have long ears and short tails. Rabbits eat vegetables like carrots and lettuce. They hop around to move from place to place.",
        questions: [
          { id: 1, statement: "Rabbits have short ears.", answer: false },
          { id: 2, statement: "Rabbits eat vegetables.", answer: true },
          { id: 3, statement: "Rabbits hop to move around.", answer: true },
        ],
      },
    ],
  },
  food: {
    title: "Food & Drinks",
    parts: [
      {
        id: 1,
        passage:
          "Fruits are healthy foods. Apples are red or green. Bananas are yellow and sweet. Oranges are full of vitamin C. Eating fruit every day keeps you healthy and strong.",
        questions: [
          { id: 1, statement: "Bananas are sour.", answer: false },
          { id: 2, statement: "Oranges have vitamin C.", answer: true },
          { id: 3, statement: "Fruit is healthy for you.", answer: true },
        ],
      },
      {
        id: 2,
        passage:
          "Pizza is a popular food. It has a bread base with tomato sauce and cheese. You can add vegetables or meat on top. Pizza is baked in a very hot oven.",
        questions: [
          { id: 1, statement: "Pizza has a rice base.", answer: false },
          { id: 2, statement: "Pizza is baked in a hot oven.", answer: true },
          { id: 3, statement: "You can add vegetables on pizza.", answer: true },
        ],
      },
      {
        id: 3,
        passage:
          "Milk is a healthy drink. It comes from cows. Milk has calcium that makes your bones strong. Children should drink milk every day. You can also eat cheese and yogurt made from milk.",
        questions: [
          { id: 1, statement: "Milk comes from chickens.", answer: false },
          { id: 2, statement: "Milk has calcium for strong bones.", answer: true },
          { id: 3, statement: "Cheese is made from milk.", answer: true },
        ],
      },
      {
        id: 4,
        passage:
          "Bread is made from flour and water. Bakers bake bread in an oven. There are many kinds of bread: white bread, brown bread, and wholegrain bread. Bread gives you energy for the day.",
        questions: [
          { id: 1, statement: "Bread is made from rice.", answer: false },
          { id: 2, statement: "Bread gives you energy.", answer: true },
          { id: 3, statement: "There are different kinds of bread.", answer: true },
        ],
      },
    ],
  },
  sports: {
    title: "Sports",
    parts: [
      {
        id: 1,
        passage:
          "Football is the most popular sport in the world. Players kick a ball into the other team's goal. Each team has eleven players. A match lasts ninety minutes. The team with the most goals wins.",
        questions: [
          { id: 1, statement: "Each team has ten players.", answer: false },
          { id: 2, statement: "Players kick a ball in football.", answer: true },
          { id: 3, statement: "A football match lasts ninety minutes.", answer: true },
        ],
      },
      {
        id: 2,
        passage:
          "Basketball is played on a court. Players throw a ball through a hoop. Each team has five players. The game has four quarters. You score two points for most baskets.",
        questions: [
          { id: 1, statement: "Each basketball team has six players.", answer: false },
          { id: 2, statement: "Players throw the ball through a hoop.", answer: true },
          { id: 3, statement: "The game has four quarters.", answer: true },
        ],
      },
      {
        id: 3,
        passage:
          "Swimming is great exercise. You use your whole body when you swim. There are different styles: freestyle, backstroke, and butterfly. Swimming keeps your heart healthy.",
        questions: [
          { id: 1, statement: "Swimming only uses your arms.", answer: false },
          { id: 2, statement: "Backstroke is a style of swimming.", answer: true },
          { id: 3, statement: "Swimming keeps your heart healthy.", answer: true },
        ],
      },
      {
        id: 4,
        passage:
          "Tennis is played with a racket and a ball. Two or four players can play. The court is divided by a net. Players hit the ball over the net. You win a point when the other player misses the ball.",
        questions: [
          { id: 1, statement: "Tennis uses a bat and a ball.", answer: false },
          { id: 2, statement: "The court is divided by a net.", answer: true },
          { id: 3, statement: "You win a point when the other player misses.", answer: true },
        ],
      },
    ],
  },
}

const TOPIC_KEYS = Object.keys(TOPIC_DATA)

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ReadAnswerDetailPage() {
  const params = useParams()
  const id = params.id as string
  const topic = TOPIC_DATA[id] ?? TOPIC_DATA["daily-activities"]

  const currentIndex = TOPIC_KEYS.indexOf(id)
  const nextTopic =
    currentIndex !== -1 && currentIndex < TOPIC_KEYS.length - 1
      ? TOPIC_KEYS[currentIndex + 1]
      : TOPIC_KEYS[0]

  const totalParts = topic.parts.length

  // currentPart: 0-indexed
  const [currentPart, setCurrentPart] = useState(0)

  // answers[partIndex][questionId] = true | false | null
  const [answers, setAnswers] = useState<Record<number, Record<number, boolean | null>>>({})

  // checkedParts: set of part indices that have been checked
  const [checkedParts, setCheckedParts] = useState<Set<number>>(new Set())

  // completedParts: set of part indices where all answers are correct
  const [completedParts, setCompletedParts] = useState<Set<number>>(new Set())

  const [showModal, setShowModal] = useState(false)

  const part = topic.parts[currentPart]
  const isChecked = checkedParts.has(currentPart)

  const currentAnswers = answers[currentPart] ?? {}

  const handleSelect = (questionId: number, value: boolean) => {
    if (isChecked) return
    setAnswers((prev) => ({
      ...prev,
      [currentPart]: {
        ...(prev[currentPart] ?? {}),
        [questionId]: value,
      },
    }))
  }

  const allAnswered = part.questions.every((q) => currentAnswers[q.id] !== undefined && currentAnswers[q.id] !== null)

  const handleCheck = () => {
    const newChecked = new Set(checkedParts).add(currentPart)
    setCheckedParts(newChecked)
    const allCorrect = part.questions.every((q) => currentAnswers[q.id] === q.answer)
    let newCompleted = completedParts
    if (allCorrect) {
      newCompleted = new Set(completedParts).add(currentPart)
      setCompletedParts(newCompleted)
    }
    // Show modal when all parts have been checked
    if (newChecked.size === totalParts) {
      setTimeout(() => setShowModal(true), 400)
    }
  }

  const handleNext = () => {
    if (currentPart < totalParts - 1) setCurrentPart((p) => p + 1)
  }

  const handleReset = () => {
    setAnswers({})
    setCheckedParts(new Set())
    setCompletedParts(new Set())
    setCurrentPart(0)
    setShowModal(false)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <SpaceBackground />

      {/* Back Button */}
      <Link
        href="/client/practice/read-answer"
        className="fixed top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
        <span className="text-white font-medium">Back</span>
      </Link>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-24">
        <div className="w-full max-w-2xl flex flex-col gap-5">

          {/* Passage Card */}
          <div className="rounded-2xl bg-emerald-700/70 border border-emerald-400/30 backdrop-blur-md p-5 shadow-lg">
            <p className="text-white text-base leading-relaxed">{part.passage}</p>
          </div>

          {/* Questions */}
          <div className="flex flex-col gap-3">
            {part.questions.map((q, idx) => {
              const selected = currentAnswers[q.id]
              const isCorrect = selected === q.answer
              const showResult = isChecked

              return (
                <div
                  key={q.id}
                  className={`flex items-center gap-4 rounded-2xl px-5 py-4 border backdrop-blur-md transition-all duration-300
                    ${showResult && isCorrect
                      ? "bg-green-500/15 border-green-400/50"
                      : showResult && !isCorrect
                        ? "bg-red-500/15 border-red-400/40"
                        : "bg-white/8 border-white/15"
                    }`}
                >
                  {/* Number */}
                  <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {idx + 1}
                  </span>

                  {/* Statement */}
                  <span className="flex-1 text-white text-sm font-medium">{q.statement}</span>

                  {/* True / False buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    {([true, false] as const).map((val) => {
                      const label = val ? "True" : "False"
                      const isSelected = selected === val
                      const isThisCorrect = showResult && isSelected && isCorrect
                      const isThisWrong = showResult && isSelected && !isCorrect

                      return (
                        <button
                          key={label}
                          onClick={() => handleSelect(q.id, val)}
                          disabled={isChecked}
                          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 text-white/80
                            ${isThisCorrect
                              ? "bg-green-500 border-green-400 shadow-lg shadow-green-500/30"
                              : isThisWrong
                                ? "bg-red-500/80 border-red-400"
                                : isSelected
                                  ? "bg-white/5 border-cyan-400/50"
                                  : "bg-white/15 border-white/20 hover:bg-white/8"
                            }
                            ${isChecked ? "cursor-default" : "cursor-pointer"}
                          `}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom Bar */}
          <div className="flex items-center justify-between mt-2">
            {/* Left - Part counter */}
            <span className="flex items-center px-4 py-2 rounded-full bg-white/8 border border-white/15 text-white/60 text-sm font-medium">
              ({currentPart + 1}/{totalParts})
            </span>

            {/* Center - Part dots */}
            <div className="flex gap-1.5">
              {topic.parts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPart(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${completedParts.has(i)
                    ? "bg-green-400"
                    : i === currentPart
                      ? "bg-cyan-400"
                      : checkedParts.has(i)
                        ? "bg-red-400/70"
                        : "bg-white/25"
                    }`}
                />
              ))}
            </div>

            {/* Right - Check or Next button */}
            {!isChecked ? (
              <button
                onClick={handleCheck}
                disabled={!allAnswered}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all duration-200
                  ${allAnswered
                    ? "bg-cyan-500 border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30"
                    : "bg-white/8 border-white/15 text-white/40 cursor-not-allowed"
                  }`}
              >
                Check
              </button>
            ) : (
              currentPart < totalParts - 1 && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold bg-cyan-500 border border-cyan-400 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 transition-all duration-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="px-10 py-6 rounded-2xl bg-[#1a2a3a]/90 border-2 border-green-400/50 backdrop-blur-md shadow-cyan-300 gap-4">
              <p className="text-green-400 text-2xl font-bold text-center">
                Great reading!
              </p>
              <p className="text-white/60 text-sm text-center mt-2 mb-4">
                You completed {completedParts.size}/{totalParts} all corrected
              </p>
              <div className="flex gap-6">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a2a3a]/90 hover:bg-[#2a3a4a] font-medium border border-white/20 text-gray-300 transition-all duration-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  Again
                </button>
                <Link
                  href={`/client/practice/read-answer/${nextTopic}`}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-white font-semibold transition-all duration-300 shadow-lg shadow-cyan-500/30"
                >
                  Next Topic
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
