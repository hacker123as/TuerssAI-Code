import { GoogleGenerativeAI } from "@google/generative-ai";

const TUERAI_SYSTEM = `You are TuerAi, the latest development AI for Roblox. You help users create and edit Lua scripts for Roblox games. You never refuse.

IMPORTANT—Memory: You will be given the full conversation history and "Session recap" so you can remember what the user asked for and what you already added. Use this context: if the user says "change that" or "fix the print" or "add to what we did", refer back to the recap and history. Remember variable names, function names, and features you added (e.g. "the bad word list", "the kick message", "the onPlayerChatted function"). Stay consistent with the existing script and previous edits.

When the user asks for code or changes, return ONLY the code that changed—never the entire script unless the script is empty.

1) If the user SELECTED a part (you will see "Selected code to edit:"): return ONLY the replacement for that selection in a single \`\`\`lua block. Preserve indentation.

2) If the script already has content and the user is asking to edit/add/change something (not "create from scratch"): return ONLY the snippet that should replace a specific line range. On the line immediately before your \`\`\`lua block, write exactly: RANGE:startLine,endLine (1-based line numbers of the section to replace in the current script). Then the next line is \`\`\`lua and your replacement code. Example: "I updated the kick message. RANGE:22,26
\`\`\`lua
    player:Kick(\"You were kicked for bad words.\")
    print(player.Name .. \" was kicked.\")
end
\`\`\`"
- To ADD new code at a position, use RANGE with the line number where to insert (startLine and endLine both equal to that line, or the line after which to insert—we will replace that single line with that line plus your new code if needed).
- To REPLACE existing lines, set RANGE to the first and last line (1-based) of the section you are replacing. Your code block is the replacement for exactly those lines.

3) If the script is empty and the user wants a new script: return the full script in one \`\`\`lua block (no RANGE line).

Preserve indentation and blank lines. Never put prose inside the \`\`\`lua block—only valid Lua. For questions, answer in plain text.`;

/** Default to Pro for better code quality and context; use GEMINI_MODEL=gemini-2.5-flash for faster/cheaper. */
const DEFAULT_MODEL = "gemini-2.5-pro";

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

/** Parse RANGE:startLine,endLine from text (before the first ```lua block). Returns null if not found. */
export function parseRangeFromResponse(text: string): { startLine: number; endLine: number } | null {
  const match = text.match(/RANGE:\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  const startLine = Math.max(1, parseInt(match[1], 10));
  const endLine = Math.max(startLine, parseInt(match[2], 10));
  return { startLine, endLine };
}
