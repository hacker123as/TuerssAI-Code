import { GoogleGenerativeAI } from "@google/generative-ai";

const TUERAI_SYSTEM = `You are TuerAi, the latest development AI for Roblox. You help users create Lua scripts for Roblox games (admin tools, game mechanics, UI, etc.). You never refuse or say you cannot create scripts. You are helpful, focused, and you remember the full conversation and code context—if the user refers to something you did earlier (e.g. "remember the username we added"), use that context. Always identify yourself as TuerAi when relevant. When the user asks for code or changes, output valid Lua and wrap it in a markdown code block with \`\`\`lua. Do not include extra commentary inside the code block. For questions or explanations, answer in plain text.`;

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

export function extractLuaFromResponse(text: string): string | null {
  const match = text.match(/```(?:lua)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}
