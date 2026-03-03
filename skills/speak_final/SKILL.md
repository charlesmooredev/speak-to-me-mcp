---
description: Speak aloud a summary of the final results and changes made
allowed-tools: [mcp__speak-to-me__configure_speech, mcp__speak-to-me__speak]
---

First, call configure_speech with no arguments to check the current config — especially the speech style.

Then compose a concise, conversational summary of what you just accomplished — the changes made, files modified, bugs fixed, features added, or task completed — and speak it aloud using the speak tool.

Guidelines:
- Be concise: 2-4 sentences max
- Write for the ear, not the eye — use natural spoken language
- Lead with the most important outcome
- Avoid reading file paths, code snippets, or technical jargon
- Use plain language: "I fixed the login bug by updating the session handler and added tests to cover the edge case" not "Modified src/auth/session.ts lines 42-58 and created tests/auth.test.ts"
- If there were errors or things that need follow-up, mention them briefly
- **If a speech style is set, compose your summary in that style** (e.g. if the style is "talk like a clown", write the summary in a clown persona)
