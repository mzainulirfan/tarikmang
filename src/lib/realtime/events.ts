export type RealtimeEventType =
  | "GAME_CREATED"
  | "PLAYER_JOINED"
  | "PLAYER_LEFT"
  | "PLAYER_READY"
  | "GAME_STARTING"
  | "COUNTDOWN_STARTED"
  | "ROUND_STARTED"
  | "PLAYER_ANSWERED"
  | "ROUND_RESULT"
  | "ROPE_PULLED"
  | "NEXT_ROUND"
  | "GAME_FINISHED"
  | "GAME_RESET";

export type RealtimeEvent<T = unknown> = {
  type: RealtimeEventType;
  roomCode: string;
  payload: T;
  timestamp: number;
};

// Example payloads per PRD #21
export type RoundStartedPayload = {
  round: number;
  questionId: string;
  question: string;
  options: number[];
  startedAt: number;
  duration: number;
};

export type PlayerAnsweredPayload = {
  team: "A" | "B";
  questionId: string;
  answer: number;
  clientTimestamp: number;
};
