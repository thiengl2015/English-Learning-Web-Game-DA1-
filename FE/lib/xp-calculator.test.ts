/**
 * Test cases for XP Calculator
 * Run these tests to verify XP calculation logic
 */

import { calculateLessonXP, calculateMaxUnitXP, calculateLevel, xpToNextLevel } from "./xp-calculator"

// Test regular lessons (1-4)
console.log("=== Regular Lessons (1-4) First Completion ===")
console.log(calculateLessonXP({ lessonNumber: 1, starsEarned: 1, isReview: false }))
// Expected: 50 XP

console.log(calculateLessonXP({ lessonNumber: 2, starsEarned: 2, isReview: false }))
// Expected: 100 XP

console.log(calculateLessonXP({ lessonNumber: 3, starsEarned: 3, isReview: false }))
// Expected: 150 XP

// Test final test (Lesson 5)
console.log("\n=== Final Test (Lesson 5) First Completion ===")
console.log(calculateLessonXP({ lessonNumber: 5, starsEarned: 1, isReview: false }))
// Expected: 100 XP

console.log(calculateLessonXP({ lessonNumber: 5, starsEarned: 2, isReview: false }))
// Expected: 150 XP

console.log(calculateLessonXP({ lessonNumber: 5, starsEarned: 3, isReview: false }))
// Expected: 200 XP

// Test review (replay)
console.log("\n=== Review (Replay) ===")
console.log(calculateLessonXP({ lessonNumber: 5, starsEarned: 3, isReview: true }))
// Expected: 100 XP (50% of 200)

console.log(calculateLessonXP({ lessonNumber: 1, starsEarned: 3, isReview: true }))
// Expected: 75 XP (50% of 150)

// Test checkpoint
console.log("\n=== Checkpoint Test ===")
console.log(calculateLessonXP({ lessonNumber: 1, starsEarned: 1, isReview: false, isCheckpoint: true }))
// Expected: 500 XP

// Test max unit XP
console.log("\n=== Max Unit XP ===")
console.log("Max XP per unit:", calculateMaxUnitXP())
// Expected: 800 XP

// Test level calculation
console.log("\n=== Level Calculation ===")
console.log("Level at 0 XP:", calculateLevel(0))
// Expected: Level 1

console.log("Level at 1250 XP:", calculateLevel(1250))
// Expected: Level 13

console.log("XP to next level from 1250:", xpToNextLevel(1250))
// Expected: 50 XP
