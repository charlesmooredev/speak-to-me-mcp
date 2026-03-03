import { spawn, execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import https from "https";
import type { SpeakResult, SystemVoice } from "./types.js";
import { LONG_TEXT_THRESHOLD } from "./constants.js";

/** Cache for system voices (parsed once per session) */
let cachedVoices: SystemVoice[] | null = null;

/** Special value meaning "use macOS system default voice" (no -v flag) */
export const SYSTEM_DEFAULT_VOICE = "default";

/**
 * Detect the best available voice at startup.
 * Returns "default" to use the macOS system voice (Siri),
 * which is set via System Settings > Spoken Content.
 */
export function detectBestVoice(): string {
  return SYSTEM_DEFAULT_VOICE;
}

/**
 * Speak text using macOS `say` command.
 * Fire-and-forget: spawns detached process and returns immediately.
 */
export function speakWithSystem(
  text: string,
  voice: string,
  rate: number,
): SpeakResult {
  try {
    // When voice is "default", omit -v to use macOS system default (Siri)
    const args: string[] = [];
    if (voice !== SYSTEM_DEFAULT_VOICE) {
      args.push("-v", voice);
    }
    args.push("-r", String(rate));

    if (text.length > LONG_TEXT_THRESHOLD) {
      // Write to temp file to avoid argument length limits
      const tmpFile = path.join(os.tmpdir(), `speak-to-me-${Date.now()}.txt`);
      fs.writeFileSync(tmpFile, text);
      args.push("-f", tmpFile);

      const child = spawn("say", args, {
        detached: true,
        stdio: "ignore",
      });
      child.unref();

      // Clean up temp file after say reads it
      setTimeout(() => {
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // Already cleaned up or in use
        }
      }, 10000);
    } else {
      args.push(text);
      const child = spawn("say", args, {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    }

    const voiceLabel = voice === SYSTEM_DEFAULT_VOICE ? "System Default (Siri)" : voice;
    return {
      engine: "system",
      voice: voiceLabel,
      textLength: text.length,
      status: "speaking",
      message: `Speaking with ${voiceLabel} at ${rate} wpm.`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      engine: "system",
      voice,
      textLength: text.length,
      status: "error",
      message: `System TTS failed: ${message}`,
    };
  }
}

/**
 * Speak text using OpenAI TTS API.
 * Downloads MP3, then plays with afplay (fire-and-forget).
 */
export async function speakWithOpenAI(
  text: string,
  voice: string,
  model: string,
): Promise<SpeakResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      engine: "openai",
      voice,
      textLength: text.length,
      status: "error",
      message:
        "OPENAI_API_KEY environment variable is not set. Set it in your MCP server config or shell profile.",
    };
  }

  try {
    const audioBuffer = await openaiTTS(text, voice, model, apiKey);

    // Save to temp file
    const tmpFile = path.join(os.tmpdir(), `speak-to-me-${Date.now()}.mp3`);
    fs.writeFileSync(tmpFile, audioBuffer);

    // Play with afplay (fire-and-forget)
    const child = spawn("afplay", [tmpFile], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();

    // Clean up after playback finishes
    child.on("close", () => {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // Already cleaned up
      }
    });

    // Fallback cleanup in case close event doesn't fire
    setTimeout(() => {
      try {
        fs.unlinkSync(tmpFile);
      } catch {
        // Already cleaned up
      }
    }, 60000);

    return {
      engine: "openai",
      voice,
      textLength: text.length,
      status: "speaking",
      message: `Speaking with OpenAI "${voice}" voice (${model}).`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      engine: "openai",
      voice,
      textLength: text.length,
      status: "error",
      message: `OpenAI TTS failed: ${message}`,
    };
  }
}

/**
 * Call the OpenAI TTS API and return the audio buffer.
 */
function openaiTTS(
  text: string,
  voice: string,
  model: string,
  apiKey: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model,
      input: text,
      voice,
      response_format: "mp3",
    });

    const req = https.request(
      {
        hostname: "api.openai.com",
        path: "/v1/audio/speech",
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          let errBody = "";
          res.on("data", (chunk: Buffer) => (errBody += chunk));
          res.on("end", () =>
            reject(new Error(`OpenAI API ${res.statusCode}: ${errBody}`)),
          );
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * List available macOS system voices by parsing `say -v '?'` output.
 * Results are cached for the session.
 */
export function listSystemVoices(): SystemVoice[] {
  if (cachedVoices) return cachedVoices;

  try {
    const output = execFileSync("say", ["-v", "?"], { encoding: "utf-8" });
    const voices: SystemVoice[] = [];

    for (const line of output.split("\n")) {
      if (!line.trim()) continue;
      // Format: "Name                locale   # Sample text"
      const match = line.match(/^(.+?)\s{2,}(\S+)\s+#\s+(.+)$/);
      if (match) {
        voices.push({
          name: match[1].trim(),
          locale: match[2],
          sample: match[3],
        });
      }
    }

    cachedVoices = voices;
    return voices;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to list system voices: ${message}`);
  }
}
