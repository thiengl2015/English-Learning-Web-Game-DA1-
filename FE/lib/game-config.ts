export type GameType = 'signal-check' | 'word-match' | 'space-race' // Add more game types as needed

export type LessonGameConfig = {
  unitId: string
  lessonId: number
  gameType: GameType
  difficulty: 'easy' | 'medium' | 'hard'
  questionsCount: number
}

// Default game configurations for each lesson type
export const DEFAULT_LESSON_GAMES: Record<string, GameType> = {
  'vocabulary': 'signal-check',
  'practice': 'signal-check',
  'test': 'signal-check'
}

// Helper function to get game route
export function getGameRoute(gameType: GameType, unitId: string, lessonId: string): string {
  return `/client/games/${gameType}?unitId=${unitId}&lessonId=${lessonId}`
}

// TODO: Admin functions to configure game types for specific lessons
export async function updateLessonGameConfig(config: LessonGameConfig): Promise<void> {
  // Will be implemented with backend integration
  console.log('Updating lesson game config:', config)
}

export async function getLessonGameConfig(unitId: string, lessonId: number): Promise<LessonGameConfig | null> {
  // Will be implemented with backend integration
  return null
}
