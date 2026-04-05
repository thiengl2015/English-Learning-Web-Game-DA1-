"use client"

import { useState, useCallback } from "react"
import type { GameQuestion, StartGameResponse, SubmitAnswerResponse, CompleteGameResponse } from "./game"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

interface UseGameStateOptions {
  sessionId?: string
  gameConfigId?: string
  gameType: string
  unitId?: string
  lessonId?: string
}

interface GameState {
  sessionId: string | null
  gameConfigId: number | null
  questions: GameQuestion[]
  currentIndex: number
  isLoading: boolean
  isStarting: boolean
  isSubmitting: boolean
  isCompleting: boolean
  error: string | null
  startGameError: string | null
  totalQuestions: number
  correctCount: number
  answeredSet: Set<number>
  wrongAnswers: Array<{
    questionId: string
    prompt: string
    yourAnswer: string
    correctAnswer: string
  }>
  gameComplete: boolean
  completionResult: CompleteGameResponse | null
  startTime: number | null
}

export function useGameState(options: UseGameStateOptions) {
  const { sessionId: initialSessionId, gameConfigId: initialGameConfigId, gameType } = options

  const [state, setState] = useState<GameState>({
    sessionId: initialSessionId || null,
    gameConfigId: initialGameConfigId ? parseInt(initialGameConfigId) : null,
    questions: [],
    currentIndex: 0,
    isLoading: false,
    isStarting: false,
    isSubmitting: false,
    isCompleting: false,
    error: null,
    startGameError: null,
    totalQuestions: 0,
    correctCount: 0,
    answeredSet: new Set(),
    wrongAnswers: [],
    gameComplete: false,
    completionResult: null,
    startTime: null,
  })

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
  }, [])

  const startGame = useCallback(async (configId?: number) => {
    const token = getToken()
    if (!token) {
      setState((s) => ({ ...s, startGameError: "Bạn chưa đăng nhập" }))
      return false
    }

    const idToUse = configId || state.gameConfigId
    if (!idToUse) {
      setState((s) => ({ ...s, startGameError: "Không có game config" }))
      return false
    }

    setState((s) => ({ ...s, isStarting: true, startGameError: null }))

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ game_config_id: idToUse }),
      })

      const json = await res.json()

      if (!json.success || !json.data) {
        throw new Error(json.message || "Không thể bắt đầu game")
      }

      const { session_id, questions, questions_count } = json.data

      setState((s) => ({
        ...s,
        sessionId: session_id,
        gameConfigId: idToUse,
        questions,
        totalQuestions: questions_count,
        currentIndex: 0,
        correctCount: 0,
        answeredSet: new Set(),
        wrongAnswers: [],
        gameComplete: false,
        completionResult: null,
        isStarting: false,
        isLoading: false,
        startTime: Date.now(),
      }))

      return true
    } catch (err: any) {
      setState((s) => ({
        ...s,
        isStarting: false,
        startGameError: err.message || "Lỗi khi bắt đầu game",
      }))
      return false
    }
  }, [getToken, state.gameConfigId])

  const submitAnswer = useCallback(
    async (questionIndex: number, answer: string) => {
      if (!state.sessionId) return null

      const token = getToken()
      if (!token) return null

      setState((s) => ({ ...s, isSubmitting: true }))

      try {
        const res = await fetch(`${API_BASE_URL}/api/games/${state.sessionId}/answer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ question_index: questionIndex, answer }),
        })

        const json = await res.json()

        if (!json.success || !json.data) {
          throw new Error(json.message || "Lỗi khi gửi câu trả lời")
        }

        const result: SubmitAnswerResponse = json.data

        setState((s) => {
          const question = s.questions[questionIndex]
          const newWrongAnswers = [...s.wrongAnswers]

          if (!result.is_correct && question) {
            newWrongAnswers.push({
              questionId: `q-${questionIndex}`,
              prompt: question.question_vi || question.question,
              yourAnswer: answer,
              correctAnswer: result.correct_answer || "",
            })
          }

          return {
            ...s,
            correctCount: result.is_correct ? s.correctCount + 1 : s.correctCount,
            answeredSet: new Set([...s.answeredSet, questionIndex]),
            wrongAnswers: newWrongAnswers,
            isSubmitting: false,
          }
        })

        return result
      } catch (err: any) {
        setState((s) => ({ ...s, isSubmitting: false }))
        return null
      }
    },
    [state.sessionId, getToken]
  )

  const completeGame = useCallback(async () => {
    if (!state.sessionId) return null

    const token = getToken()
    if (!token) return null

    const timeSpent = state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0

    setState((s) => ({ ...s, isCompleting: true }))

    try {
      const res = await fetch(`${API_BASE_URL}/api/games/${state.sessionId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ time_spent: timeSpent }),
      })

      const json = await res.json()

      if (!json.success || !json.data) {
        throw new Error(json.message || "Lỗi khi hoàn thành game")
      }

      const result: CompleteGameResponse = json.data

      setState((s) => ({
        ...s,
        completionResult: result,
        gameComplete: true,
        isCompleting: false,
      }))

      return result
    } catch (err: any) {
      setState((s) => ({ ...s, isCompleting: false }))
      return null
    }
  }, [state.sessionId, state.startTime, getToken])

  const currentQuestion = state.questions[state.currentIndex] || null

  const moveToNext = useCallback(() => {
    setState((s) => {
      const nextIndex = s.currentIndex + 1
      if (nextIndex >= s.totalQuestions) {
        return { ...s, currentIndex: nextIndex }
      }
      return { ...s, currentIndex: nextIndex }
    })
  }, [])

  return {
    state,
    startGame,
    submitAnswer,
    completeGame,
    moveToNext,
    currentQuestion,
    progress: state.totalQuestions > 0
      ? ((state.currentIndex + 1) / state.totalQuestions) * 100
      : 0,
  }
}