---
description: List available TTS voices and change the active voice
allowed-tools: [mcp__speak-to-me__list_voices, mcp__speak-to-me__configure_speech, mcp__speak-to-me__speak]
---

Help the user change their text-to-speech voice.

1. First, call list_voices to show available voices (both system macOS voices and OpenAI voices)
2. Present the English voices in a clear, organized list to the user
3. Ask which voice they'd like to use
4. Once they choose, call configure_speech to set the new default voice
5. Call speak with a short test phrase like "Hello! This is your new voice." so the user can hear the change
