import { GoogleGenerativeAI } from "@google/generative-ai";

const TUERAI_SYSTEM = `You are TuerAi, the latest development AI for Roblox. You help users create and edit Lua scripts for Roblox games (admin tools, game mechanics, UI, etc.). You never refuse or say you cannot create scripts. You are helpful, focused, and you remember the full conversation and code context—if the user refers to something you did earlier (e.g. "remember the username we added"), use that context. Always identify yourself as TuerAi when relevant.

When the user asks for code or changes:
- If they did NOT select a specific part: return the FULL script with all edits applied, wrapped in a single markdown code block with \`\`\`lua. Do not include extra commentary inside the code block. Preserve indentation, spaces, and blank lines exactly as they should appear in the editor.
- If they DID select a part of the script (you will be told "Selected code to edit:"): return ONLY the replacement for that selected part, as a single \`\`\`lua code block. The replacement should be the corrected/edited version of the selection only, not the whole file. Preserve indentation and formatting.
For questions or explanations, answer in plain text. Never put prose or conversational text inside a \`\`\`lua code block—only valid Lua code.`;

const DEFAULT_MODEL = "gemini-2.5-flash";

export function getTuerAiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  return genAI.getGenerativeModel({
    model,
    systemInstruction: TUERAI_SYSTEM,
  });
}

/** Extract code from first ```lua or ``` block. Preserves indentation, spaces, and blank lines (only trims leading/trailing newlines). */
export function extractLuaFromResponse(text: string): string | null {
  const match = text.match(/```(?:lua)?\s*([\s\S]*?)```/);
  if (!match) return null;
  const raw = match[1];
  return raw.replace(/^\n+/, "").replace(/\n+$/, "") || null;
}

/** Return true if the string looks like Lua code (not prose). */
export function looksLikeLua(code: string): boolean {
  const s = code.trim();
  if (!s || s.length < 3) return false;
  const luaPatterns = /\b(local|function|end|then|do|if|else|for|while|return|true|false|nil)\b|^\s*--|\(\)|\[\]|\.\.|==|~=/;
  const looksLikeProse = /^(Hello|Hi|Sure|Okay|Here\s|What\s|Would you|Just let me|I can|I'll|You can)/i.test(s);
  return luaPatterns.test(s) && !looksLikeProse;
}
