/**
 * XP Calculation System
 * Calculates experience points based on lesson completion and performance
 */

export interface LessonCompletionData {
  lessonNumber: number // 1-5
  starsEarned: number // 1-3
  isReview: boolean // Whether this is a replay
  isCheckpoint?: boolean // Whether this is a checkpoint test
}

export interface XPResult {
  xp: number
  message: string
  breakdown: string
}

/**
 * Calculate XP for lesson completion
 */
export function calculateLessonXP(data: LessonCompletionData): XPResult {
  const { lessonNumber, starsEarned, isReview, isCheckpoint } = data

  // Checkpoint special case
  if (isCheckpoint) {
    return {
      xp: 500,
      message: "Checkpoint Completed!",
      breakdown: "100 XP × 5 units = 500 XP",
    }
  }

  // Validate inputs
  if (lessonNumber < 1 || lessonNumber > 5) {
    throw new Error("Invalid lesson number. Must be between 1 and 5.")
  }
  if (starsEarned < 1 || starsEarned > 3) {
    throw new Error("Invalid stars earned. Must be between 1 and 3.")
  }

  let baseXP = 0

  // Regular lessons (1-4)
  if (lessonNumber >= 1 && lessonNumber <= 4) {
    switch (starsEarned) {
      case 1:
        baseXP = 50
        break
      case 2:
        baseXP = 100
        break
      case 3:
        baseXP = 150
        break
    }
  }
  // Final test (Lesson 5)
  else if (lessonNumber === 5) {
    switch (starsEarned) {
      case 1:
        baseXP = 100
        break
      case 2:
        baseXP = 150
        break
      case 3:
        baseXP = 200
        break
    }
  }

  // Apply review multiplier (50% for reviews)
  const finalXP = isReview ? Math.floor(baseXP * 0.5) : baseXP

  const lessonType = lessonNumber === 5 ? "Final Test" : `Lesson ${lessonNumber}`
  const reviewText = isReview ? " (Review)" : ""

  return {
    xp: finalXP,
    message: `${lessonType} Completed${reviewText}!`,
    breakdown: isReview
      ? `${baseXP} XP × 50% (review) = ${finalXP} XP`
      : `${starsEarned} star${starsEarned > 1 ? "s" : ""} = ${finalXP} XP`,
  }
}

/**
 * Get XP table for reference
 */
export function getXPTable() {
  return {
    regularLessons: {
      title: "Lessons 1-4 (First Completion)",
      rewards: [
        { stars: 1, xp: 50 },
        { stars: 2, xp: 100 },
        { stars: 3, xp: 150 },
      ],
    },
    finalTest: {
      title: "Lesson 5 - Final Test (First Completion)",
      rewards: [
        { stars: 1, xp: 100 },
        { stars: 2, xp: 150 },
        { stars: 3, xp: 200 },
      ],
    },
    checkpoint: {
      title: "Checkpoint Test",
      xp: 500,
      description: "100 XP × 5 units skipped",
    },
    review: {
      title: "Review (Replay)",
      multiplier: 0.5,
      description: "50% of original XP",
    },
  }
}

/**
 * Calculate total unit XP (sum of all 5 lessons at 3 stars)
 */
export function calculateMaxUnitXP(): number {
  // Lessons 1-4: 150 XP each × 4 = 600 XP
  // Lesson 5: 200 XP
  // Total: 800 XP per unit
  return 150 * 4 + 200
}

/**
 * Estimate level from total XP
 * Example: 100 XP per level
 */
export function calculateLevel(totalXP: number, xpPerLevel = 100): number {
  return Math.floor(totalXP / xpPerLevel) + 1
}

/**
 * Calculate XP needed for next level
 */
export function xpToNextLevel(totalXP: number, xpPerLevel = 100): number {
  const currentLevelXP = totalXP % xpPerLevel
  return xpPerLevel - currentLevelXP
}
