import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-check";
import { getRuntimeProvider, setRuntimeProvider } from "@/lib/ai-provider-state";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const provider = await getRuntimeProvider();

  return NextResponse.json({
    provider,
    envProvider: process.env.AI_PROVIDER ?? "gemini",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { provider } = await request.json();

  if (provider !== "gemini" && provider !== "openai") {
    return NextResponse.json({ error: "Invalid provider. Use 'gemini' or 'openai'." }, { status: 400 });
  }

  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set in .env" }, { status: 400 });
  }

  await setRuntimeProvider(provider);

  return NextResponse.json({ 
    success: true, 
    provider,
    message: `AI provider switched to ${provider === "openai" ? "OpenAI (GPT-4o-mini)" : "Gemini 2.0 Flash"}` 
  });
}
