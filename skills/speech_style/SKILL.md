---
description: Set a speaking style or persona for how Claude composes spoken text
allowed-tools: [mcp__speak-to-me__speech_style, mcp__speak-to-me__speak]
argument-hint: <style like "talk like a clown" or "clear" to reset>
---

Set the speaking style for: $ARGUMENTS

Use the speech_style tool to set how Claude composes spoken summaries. This changes the writing style, not the TTS voice.

- If the user provides a style (e.g. "talk like a clown", "be super concise"): call speech_style to set it, then call speak with a short test phrase composed in that style so the user can hear the result.
- If the user says "clear", "reset", or "none": call speech_style with an empty string to clear the style.
- If no arguments: call speech_style with no args to show the current style, then ask what style they'd like.

When testing a new style, compose a fun 1-2 sentence test phrase that demonstrates the style. For example:
- Clown style: "Honk honk! Your code changes are in and they're no joke!"
- Business woman: "I've completed the deliverables on schedule. All tests passing, ready for stakeholder review."
- Pirate: "Arrr! The bugs be vanquished and yer code be shipshape, captain!"
