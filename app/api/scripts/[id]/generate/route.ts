import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTuerAiModel, extractLuaFromResponse } from "@/lib/gemini";

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
  const { message, history } = body as { message?: string; history?: Array<{ role: string; content: string }> };
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Generation failed. Please try again.", detail: "GEMINI_API_KEY is not set. Add it in Vercel Environment Variables." },
      { status: 500 }
    );
  }

  try {
    const model = getTuerAiModel();
    const historyList = Array.isArray(history) ? history : [];
    const parts = [
      `Current script content:\n\`\`\`lua\n${script.content || "-- empty"}\n\`\`\``,
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

    const code = extractLuaFromResponse(text) ?? text;

    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: CREDITS_PER_GENERATION } },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { credits: true },
    });

    return NextResponse.json({
      reply: text,
      code,
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
