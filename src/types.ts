/** Which TTS engine to use */
export type Engine = "system" | "openai";

/** Session-level speech configuration (mutable, stored in memory) */
export interface SpeechConfig {
  engine: Engine;
  voice: string;
  rate: number;
  openaiModel: string;
  openaiVoice: string;
  speechStyle: string;
}

/** Result from parsing `say -v '?'` */
export interface SystemVoice {
  name: string;
  locale: string;
  sample: string;
}

/** Result from a speak operation */
export interface SpeakResult {
  engine: Engine;
  voice: string;
  textLength: number;
  status: "speaking" | "error";
  message: string;
}
