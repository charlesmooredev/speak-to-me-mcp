---
description: Speak aloud the current plan or approach before implementation
allowed-tools: [mcp__speak-to-me__configure_speech, mcp__speak-to-me__speak]
---

First, call configure_speech with no arguments to check the current config — especially the speech style.

Then compose a concise, conversational summary of your current plan or approach and speak it aloud using the speak tool. This should cover what you're about to do, the key steps, and any important decisions.

Guidelines:
- Be concise: 2-4 sentences max
- Write for the ear — use natural spoken language
- Focus on the "what" and "why", not implementation details
- Example: "Here's my plan. I'm going to add form validation to the signup page. I'll create a validation utility, wire it up to the form inputs, and display inline error messages. The existing styles already support error states, so no CSS changes needed."
- If there are trade-offs or choices you made, briefly explain why
- **If a speech style is set, compose your summary in that style** (e.g. if the style is "talk like a pirate", write the summary in a pirate persona)
