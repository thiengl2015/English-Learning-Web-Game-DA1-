/**
 * Game API Service
 * Handles all game-related API calls to the backend
 */

const API_BASE_URL = "http://localhost:5000/api";

// ============================================================================
// TYPES
// ============================================================================

export type GameType = "galaxy-match" | "planetary-order" | "rescue-mission" | "signal-check";

export interface GameOption {
  id: string;
  text: string;
}

export interface GameQuestion {
  index: number;
  vocab_id: number;
  question: string;
  question_vi?: string;
  type: string;
  options?: GameOption[];
  words?: string[];
  audio_url?: string | null;
  correct_answer?: never; // intentionally excluded from BE response
  translation?: string;
  phonetic?: string;
  hint?: string;
}

export interface GameConfig {
  id: number;
  game_type: GameType;
  unit_id: number;
  lesson_id: number;
  difficulty: "easy" | "medium" | "hard";
  questions_count: number;
  time_limit: number;
  passing_score: number;
  xp_reward: number;
  user_best?: {
    score: number;
    xp: number;
  } | null;
  unit?: { id: number; title: string; icon: string };
  lesson?: { id: number; title: string; type: string };
}

export interface StartGameResponse {
  session_id: string;
  game_type: GameType;
  questions_count: number;
  time_limit: number;
  passing_score: number;
  questions: GameQuestion[];
  started_at: string;
}

export interface SubmitAnswerResponse {
  question_index: number;
  is_correct: boolean;
  correct_answer: string | null;
  current_score: number;
  answered_count: number;
  total_questions: number;
}

export interface CompleteGameResponse {
  session_id: string;
  status: "completed";
  score: number;
  correct_answers: number;
  total_questions: number;
  accuracy: number;
  passed: boolean;
  passing_score: number;
  xp_earned: number;
  time_spent: number;
  message: string;
}

export interface GameResult {
  session_id: string;
  game_type: GameType;
  status: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  accuracy: number;
  passed: boolean;
  passing_score: number;
  xp_earned: number;
  time_spent: number;
  started_at: string;
  completed_at: string;
  lesson?: { id: number; title: string; type: string };
  unit?: { id: number; title: string; icon: string };
  wrong_answers_count: number;
  questions?: GameQuestion[];
}

export interface GameTypeInfo {
  type: GameType;
  name: string;
  description: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data: T; message: string }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || "API request failed");
  }

  return json as { success: boolean; data: T; message: string };
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all available game types
 */
export async function getGameTypes(): Promise<GameTypeInfo[]> {
  const res = await apiFetch<GameTypeInfo[]>(`${API_BASE_URL}/games/types`);
  return res.data;
}

/**
 * Get available games for a specific lesson
 */
export async function getGamesByLesson(lessonId: number): Promise<GameConfig[]> {
  const res = await apiFetch<GameConfig[]>(`${API_BASE_URL}/games/lesson/${lessonId}`);
  return res.data;
}

/**
 * Start a new game session
 */
export async function startGame(gameConfigId: number): Promise<StartGameResponse> {
  const res = await apiFetch<StartGameResponse>(`${API_BASE_URL}/games/start`, {
    method: "POST",
    body: JSON.stringify({ game_config_id: gameConfigId }),
  });
  return res.data;
}

/**
 * Replay a game
 */
export async function replayGame(gameConfigId: number): Promise<StartGameResponse> {
  const res = await apiFetch<StartGameResponse>(
    `${API_BASE_URL}/games/${gameConfigId}/replay`,
    { method: "POST" }
  );
  return res.data;
}

/**
 * Submit an answer for a question
 */
export async function submitAnswer(
  sessionId: string,
  questionIndex: number,
  answer: string
): Promise<SubmitAnswerResponse> {
  const res = await apiFetch<SubmitAnswerResponse>(
    `${API_BASE_URL}/games/${sessionId}/answer`,
    {
      method: "POST",
      body: JSON.stringify({ question_index: questionIndex, answer }),
    }
  );
  return res.data;
}

/**
 * Complete a game session
 */
export async function completeGame(
  sessionId: string,
  timeSpent: number = 0
): Promise<CompleteGameResponse> {
  const res = await apiFetch<CompleteGameResponse>(
    `${API_BASE_URL}/games/${sessionId}/complete`,
    {
      method: "POST",
      body: JSON.stringify({ time_spent: timeSpent }),
    }
  );
  return res.data;
}

/**
 * Get game session results
 */
export async function getGameResults(sessionId: string): Promise<GameResult> {
  const res = await apiFetch<GameResult>(`${API_BASE_URL}/games/${sessionId}/results`);
  return res.data;
}

/**
 * Get user's game history
 */
export async function getGameHistory(params?: {
  game_type?: GameType;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams()
  if (params?.game_type) searchParams.set("game_type", params.game_type)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  const query = searchParams.toString()
  const url = `${API_BASE_URL}/games/history${query ? `?${query}` : ""}`;
  return apiFetch<{ sessions: GameResult[]; pagination: object }>(url);
}

/**
 * Get user's game statistics
 */
export async function getGameStatistics() {
  return apiFetch<{
    total_games: number;
    games_passed: number;
    games_failed: number;
    pass_rate: number;
    perfect_scores: number;
    average_score: number;
    best_score: number;
    total_xp_earned: number;
    total_correct: number;
    total_questions: number;
    accuracy: number;
    by_game_type: { game_type: GameType; games_played: number; average_score: number; total_xp: number }[];
  }>(`${API_BASE_URL}/games/statistics`);
}

/**
 * Map BE game_type to FE route
 */
export function gameTypeToRoute(gameType: GameType): string {
  const map: Record<GameType, string> = {
    "galaxy-match": "galaxy-match",
    "planetary-order": "planetary-order",
    "rescue-mission": "rescue-mission",
    "signal-check": "signal-check",
  };
  return map[gameType] || "signal-check";
}

/**
 * Map BE question to signal-check format
 */
export function mapSignalCheckQuestion(q: GameQuestion) {
  return {
    questionId: `q-${q.index}`,
    type: "vocabulary" as const,
    prompt: q.question_vi || q.question,
    audioUrl: q.audio_url || undefined,
    imageUrl: undefined,
    options:
      q.options?.map((o) => ({ id: o.id, text: o.text })) || [],
    correctAnswerId: q.options?.find((o) => {
      // The BE sends options with is_correct, but doesn't strip it for frontend
      // The BE strips correct_answer at the questions level, but options are still there
      // We need to trust the frontend won't peek, but for local validation we use the answer API
      return true;
    })?.id || "A",
  };
}