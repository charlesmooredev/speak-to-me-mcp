# speak-to-me-mcp

Give Claude Code a voice. This MCP server enables Claude to speak summaries, announcements, and explanations aloud using text-to-speech — right from your terminal.

## How it works

When you use a slash command like `/speak_final`, Claude composes a natural, concise summary of what just happened and speaks it through your Mac's speakers. You get an audible debrief without leaving your terminal.

**Two TTS engines available:**

| Engine | Quality | Cost | Setup |
|--------|---------|------|-------|
| **System** (default) | Good — uses macOS built-in voices | Free | Zero config |
| **OpenAI** | Excellent — natural, expressive voices | ~$0.015 per 1K chars | Requires API key |

## Installation

### Plugin Install (Recommended)

The easiest way — installs the MCP server, tools, and slash commands together:

```bash
/plugin marketplace add charlesmooredev/speak-to-me-mcp
/plugin install speak-to-me@speak-to-me
```

That's it — works immediately with no API keys.

### Updating

```bash
/plugin marketplace update
/plugin install speak-to-me@speak-to-me
```

### MCP-Only Install

If you just want the tools without the slash commands:

```bash
claude mcp add speak-to-me -- node "/path/to/speak-to-me-mcp/dist/index.cjs"
```

### Building from Source

```bash
git clone https://github.com/charlesmooredev/speak-to-me-mcp.git
cd speak-to-me-mcp
npm install
npm run build
npm run bundle
```

### (Optional) Enable OpenAI Premium Voices

For higher quality speech, add your OpenAI API key to the MCP config:

```bash
claude mcp add speak-to-me \
  -e OPENAI_API_KEY=sk-your-key-here \
  -- node "/path/to/speak-to-me-mcp/dist/index.cjs"
```

Or set it in your `.mcp.json`:

```json
{
  "mcpServers": {
    "speak-to-me": {
      "command": "node",
      "args": ["/path/to/speak-to-me-mcp/dist/index.cjs"],
      "env": {
        "OPENAI_API_KEY": "sk-your-key-here"
      }
    }
  }
}
```

## Slash Commands

### `/speak_final`

Speaks a summary of the final results after Claude finishes a task. Claude will compose a natural 2-4 sentence overview of what changed — files modified, bugs fixed, features added — and read it aloud.

**Example:** After fixing a bug, you'll hear something like:
> "I fixed the authentication timeout issue. The session handler was losing the refresh token on redirect. I updated the token storage logic and added a test to cover that edge case."

### `/speak_plan`

Speaks Claude's current plan before implementation begins. Useful for reviewing the approach hands-free before giving the go-ahead.

**Example:** Before starting work, you'll hear:
> "Here's my plan. I'm going to add form validation to the signup page. I'll create a validation utility, wire it up to the form inputs, and display inline error messages. The existing styles already support error states, so no CSS changes needed."

### `/change_voice`

Lists all available voices and lets you switch to a different one. Claude will play a test phrase with the new voice so you can hear it before committing.

## MCP Tools

These are the underlying tools that power the slash commands. Claude can also call them directly during any conversation.

### `speak`

Speak text aloud using text-to-speech.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | Yes | Text to speak (max 5000 chars) |
| `voice` | string | No | Override voice name |
| `engine` | `"system"` \| `"openai"` | No | Override TTS engine |

Audio plays in the background — the tool returns immediately without blocking Claude.

### `list_voices`

List available TTS voices.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `engine` | `"system"` \| `"openai"` \| `"all"` | No | Which voices to list (default: `"all"`) |

### `configure_speech`

Set session defaults. Call with no arguments to view current config.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `engine` | `"system"` \| `"openai"` | No | Default TTS engine |
| `voice` | string | No | Default system voice |
| `openai_voice` | string | No | Default OpenAI voice |
| `openai_model` | `"tts-1"` \| `"tts-1-hd"` | No | OpenAI model quality |
| `rate` | number | No | Speech rate in WPM (50-500, default 200) |

## Voice Options

### System Voices (macOS)

The default voice is your **macOS system voice** — whatever you've set in System Settings > Accessibility > Spoken Content. This means if you have a Siri voice selected (like "American Voice 4"), that's what you'll hear.

To change your system voice: System Settings > Accessibility > Spoken Content > System Voice. Or use `/change_voice` to pick a specific named voice.

Other notable system voices:

| Voice | Style |
|-------|-------|
| Samantha | Classic, clear female |
| Daniel | British male |
| Reed | Natural male |
| Sandy | Natural female |
| Fred | Classic robotic |
| Whisper | Whispered speech |

Run `/change_voice` to hear them all and pick your favorite.

### OpenAI Voices

Available when `OPENAI_API_KEY` is set:

| Voice | Style |
|-------|-------|
| alloy | Neutral, balanced |
| ash | Conversational, warm |
| ballad | Expressive, dramatic |
| coral | Clear, friendly |
| echo | Smooth, resonant |
| fable | Distinctive, narrative |
| **nova** (default) | Energetic, natural |
| onyx | Deep, authoritative |
| sage | Calm, measured |
| shimmer | Light, expressive |

**Models:**
- `tts-1` — Fast, good quality (default)
- `tts-1-hd` — Slower, higher quality

## Project Structure

```
speak-to-me-mcp/
  src/
    index.ts        Entry point
    tools.ts        MCP tool registration
    tts.ts          TTS engine logic (system + OpenAI)
    types.ts        TypeScript interfaces
    constants.ts    Defaults and limits
  skills/
    speak_final/    /speak_final slash command
    speak_plan/     /speak_plan slash command
    change_voice/   /change_voice slash command
  dist/
    index.cjs       Bundled server (run this)
```

## Requirements

- **macOS** (uses `say` and `afplay` commands)
- **Node.js** >= 18
- **OpenAI API key** (optional, for premium voices)

## License

MIT
