import type { SpeechConfig } from "./types.js";

/** Maximum text length to speak in a single call */
export const MAX_TEXT_LENGTH = 5000;

/** Default speech rate in words per minute for macOS say */
export const DEFAULT_RATE = 200;

/** Threshold for using temp file instead of inline text with say */
export const LONG_TEXT_THRESHOLD = 2000;

/** Default speech configuration */
export const DEFAULT_CONFIG: SpeechConfig = {
  engine: "system",
  voice: "default",
  rate: DEFAULT_RATE,
  openaiModel: "tts-1",
  openaiVoice: "nova",
  speechStyle: "",
};

/** Available OpenAI TTS voices */
export const OPENAI_VOICES = [
  { name: "alloy", description: "Neutral, balanced" },
  { name: "ash", description: "Conversational, warm" },
  { name: "ballad", description: "Expressive, dramatic" },
  { name: "coral", description: "Clear, friendly" },
  { name: "echo", description: "Smooth, resonant" },
  { name: "fable", description: "Distinctive, narrative" },
  { name: "nova", description: "Energetic, natural" },
  { name: "onyx", description: "Deep, authoritative" },
  { name: "sage", description: "Calm, measured" },
  { name: "shimmer", description: "Light, expressive" },
] as const;

/** Available OpenAI TTS models */
export const OPENAI_MODELS = ["tts-1", "tts-1-hd"] as const;
