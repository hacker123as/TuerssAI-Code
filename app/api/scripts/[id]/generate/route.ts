import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTuerAiModel, extractLuaFromResponse, looksLikeLua, parseRangeFromResponse } from "@/lib/gemini";

const CREDITS_PER_GENERATION = 1;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.credits < CREDITS_PER_GENERATION) {
    return NextResponse.json(
      { error: "Insufficient credits", credits: user.credits },
      { status: 402 }
    );
  }
  const { id } = await params;
  const script = await prisma.script.findFirst({
    where: { id, userId: user.id },
  });
  if (!script) return NextResponse.json({ error: "Script not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { message, history, selectedCode } = body as {
    message?: string;
    history?: Array<{ role: string; content: string }>;
    selectedCode?: string;
  };
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const isSelectionEdit = Boolean(selectedCode && selectedCode.trim().length > 0);

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Generation failed. Please try again.", detail: "GEMINI_API_KEY is not set. Add it in Vercel Environment Variables." },
      { status: 500 }
    );
  }

  try {
    const model = getTuerAiModel();
    const historyList = Array.isArray(history) ? history : [];
    const hasExistingContent = Boolean(script.content && script.content.trim().length > 0);

    const userTurns = historyList.filter((h) => h.role === "user");
    const recapLines = userTurns.slice(-6).map((h) => {
      const preview = (h.content || "").replace(/\n/g, " ").slice(0, 120);
      return `- User asked: ${preview}${preview.length >= 120 ? "…" : ""}`;
    });
    const sessionRecap =
      recapLines.length > 0
        ? `Session recap (remember these so you can refer back—variable names, what you added, etc.):\n${recapLines.join("\n")}`
        : "";

    const parts = [
      ...(sessionRecap ? [sessionRecap, ""] : []),
      `Current script content (${hasExistingContent ? "has content—return ONLY the changed section. Put RANGE:startLine,endLine (1-based) on the line right before your lua code block" : "empty—return the full script in one lua code block"}):\n\`\`\`lua\n${script.content || "-- empty"}\n\`\`\``,
      ...(isSelectionEdit
        ? [
            "",
            `Selected code to edit (return ONLY the replacement for this part):\n\`\`\`lua\n${selectedCode!.trim()}\n\`\`\``,
          ]
        : []),
      "Conversation (earlier messages include code context so you can remember what you wrote):",
      ...historyList.map((h) => `${h.role === "user" ? "User" : "TuerAi"}: ${h.content}`),
      `User: ${message}`,
    ];
    const prompt = parts.join("\n\n");
    const result = await model.generateContent(prompt);
    const response = result.response;

    // Handle blocked or empty response (Gemini can block or return no candidates)
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts?.length) {
      const blockReason = candidate?.finishReason ?? response.promptFeedback?.blockReason ?? "No content returned";
      throw new Error(`AI response blocked or empty: ${blockReason}`);
    }

    let text = "";
    try {
      text = response.text() ?? "";
    } catch {
      text = candidate.content.parts.map((p: { text?: string }) => p.text ?? "").join("");
    }

    const extracted = extractLuaFromResponse(text);
    const code = extracted && looksLikeLua(extracted) ? extracted : null;
    const replaceRange = parseRangeFromResponse(text);

    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: CREDITS_PER_GENERATION } },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    let replyWithoutCode = text.replace(/```[\s\S]*?```/g, "").trim();
    replyWithoutCode = replyWithoutCode.replace(/\s*RANGE:\s*\d+\s*,\s*\d+\s*/gi, "").trim();
    return NextResponse.json({
      reply: replyWithoutCode || text,
      code: code ?? undefined,
      isPartial: (isSelectionEdit || !!replaceRange) && !!code,
      replaceRange: replaceRange ?? undefined,
      credits: updatedUser?.credits ?? user.credits - CREDITS_PER_GENERATION,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isRateLimit =
      message.includes("429") ||
      message.includes("quota") ||
      message.includes("rate limit") ||
      message.includes("Too Many Requests");
    console.error("TuerAi generate error:", err);
    if (isRateLimit) {
      return NextResponse.json(
        {
          error: "Rate limit reached",
          detail:
            "Gemini API quota exceeded. Wait a minute and try again, or check your plan at https://ai.google.dev/gemini-api/docs/rate-limits",
        },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Generation failed. Please try again.", detail: message },
      { status: 500 }
    );
  }
}
