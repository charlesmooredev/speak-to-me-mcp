import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { speakWithSystem, speakWithOpenAI, listSystemVoices, detectBestVoice } from "./tts.js";
import {
  DEFAULT_CONFIG,
  MAX_TEXT_LENGTH,
  OPENAI_VOICES,
  OPENAI_MODELS,
} from "./constants.js";
import type { SpeechConfig, Engine } from "./types.js";

export function registerTools(server: McpServer): void {
  // Session-level config — uses macOS system default voice (Siri)
  const config: SpeechConfig = { ...DEFAULT_CONFIG, voice: detectBestVoice() };

  // ── Tool 1: speak ─────────────────────────────────────────────────────

  server.tool(
    "speak",
    `Speak text aloud using text-to-speech. Use this to give Claude a voice — summarize changes, announce completions, or narrate explanations audibly. Audio plays on the user's machine and the tool returns immediately without waiting for speech to finish.

Default engine is macOS system TTS (free, offline). Set engine to "openai" for higher quality (requires OPENAI_API_KEY env var).`,
    {
      text: z
        .string()
        .min(1)
        .max(MAX_TEXT_LENGTH)
        .describe(
          "The text to speak aloud. Keep it concise — aim for 1-3 sentences summarizing what happened.",
        ),
      voice: z
        .string()
        .optional()
        .describe(
          "Voice name. For system: any installed macOS voice (e.g. 'Samantha', 'Daniel'). For openai: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer.",
        ),
      engine: z
        .enum(["system", "openai"])
        .optional()
        .describe(
          'TTS engine: "system" (macOS say, free) or "openai" (premium, requires OPENAI_API_KEY). Defaults to session config.',
        ),
    },
    async ({ text, voice, engine }) => {
      try {
        const useEngine: Engine = engine ?? config.engine;

        if (useEngine === "openai") {
          const useVoice = voice ?? config.openaiVoice;
          const result = await speakWithOpenAI(
            text,
            useVoice,
            config.openaiModel,
          );
          return {
            content: [
              {
                type: "text" as const,
                text:
                  result.status === "error"
                    ? `Speech error: ${result.message}`
                    : `Speaking ${result.textLength} chars with OpenAI "${result.voice}" voice.`,
              },
            ],
            isError: result.status === "error",
          };
        }

        // System engine (macOS say)
        const useVoice = voice ?? config.voice;
        const result = speakWithSystem(text, useVoice, config.rate);
        return {
          content: [
            {
              type: "text" as const,
              text:
                result.status === "error"
                  ? `Speech error: ${result.message}`
                  : `Speaking ${result.textLength} chars with system voice "${result.voice}".`,
            },
          ],
          isError: result.status === "error",
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // ── Tool 2: list_voices ───────────────────────────────────────────────

  server.tool(
    "list_voices",
    "List available text-to-speech voices. Returns system (macOS) voices and/or OpenAI voices depending on the engine parameter.",
    {
      engine: z
        .enum(["system", "openai", "all"])
        .default("all")
        .describe(
          'Which engine voices to list: "system", "openai", or "all" (default).',
        ),
    },
    async ({ engine }) => {
      try {
        const sections: string[] = [];

        if (engine === "system" || engine === "all") {
          const voices = listSystemVoices();
          const englishVoices = voices.filter((v) =>
            v.locale.startsWith("en_"),
          );
          const otherVoices = voices.filter(
            (v) => !v.locale.startsWith("en_"),
          );

          sections.push("## System Voices (macOS)\n");
          sections.push(`### English (${englishVoices.length} voices)\n`);
          sections.push(
            englishVoices.map((v) => `  ${v.name} (${v.locale})`).join("\n"),
          );

          if (otherVoices.length > 0) {
            sections.push(
              `\n### Other Languages (${otherVoices.length} voices)\n`,
            );
            sections.push(
              otherVoices.map((v) => `  ${v.name} (${v.locale})`).join("\n"),
            );
          }
        }

        if (engine === "openai" || engine === "all") {
          sections.push("\n## OpenAI Voices\n");
          sections.push("Requires OPENAI_API_KEY environment variable.\n");
          sections.push(
            OPENAI_VOICES.map((v) => `  ${v.name} — ${v.description}`).join(
              "\n",
            ),
          );
          sections.push(`\nModels: ${OPENAI_MODELS.join(", ")}`);
        }

        return {
          content: [{ type: "text" as const, text: sections.join("\n") }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error listing voices: ${message}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // ── Tool 3: configure_speech ──────────────────────────────────────────

  server.tool(
    "configure_speech",
    "Set default speech preferences for this session. Changes persist until the MCP server restarts. Call with no arguments to view current config.",
    {
      engine: z
        .enum(["system", "openai"])
        .optional()
        .describe('Default TTS engine: "system" or "openai".'),
      voice: z
        .string()
        .optional()
        .describe(
          "Default system voice name (e.g. 'Samantha', 'Daniel', 'Shelley').",
        ),
      openai_voice: z
        .string()
        .optional()
        .describe("Default OpenAI voice (e.g. 'nova', 'alloy', 'onyx')."),
      openai_model: z
        .enum(["tts-1", "tts-1-hd"])
        .optional()
        .describe(
          'OpenAI model: "tts-1" (fast) or "tts-1-hd" (higher quality).',
        ),
      rate: z
        .number()
        .min(50)
        .max(500)
        .optional()
        .describe(
          "Speech rate in words per minute for system engine. Default 200. Range: 50-500.",
        ),
    },
    async ({ engine, voice, openai_voice, openai_model, rate }) => {
      try {
        const changes: string[] = [];

        if (engine !== undefined) {
          config.engine = engine;
          changes.push(`engine: ${engine}`);
        }
        if (voice !== undefined) {
          config.voice = voice;
          changes.push(`system voice: ${voice}`);
        }
        if (openai_voice !== undefined) {
          config.openaiVoice = openai_voice;
          changes.push(`openai voice: ${openai_voice}`);
        }
        if (openai_model !== undefined) {
          config.openaiModel = openai_model;
          changes.push(`openai model: ${openai_model}`);
        }
        if (rate !== undefined) {
          config.rate = rate;
          changes.push(`rate: ${rate} wpm`);
        }

        if (changes.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: [
                  "Current speech configuration:",
                  `  engine: ${config.engine}`,
                  `  system voice: ${config.voice}`,
                  `  openai voice: ${config.openaiVoice}`,
                  `  openai model: ${config.openaiModel}`,
                  `  rate: ${config.rate} wpm`,
                ].join("\n"),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Speech config updated: ${changes.join(", ")}`,
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
