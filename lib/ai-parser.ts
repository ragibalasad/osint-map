import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getRuntimeProvider } from "@/lib/ai-provider-state";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export interface ParsedIntel {
  title: string;
  description: string;
  locationName: string | null; // Changed: Extract name, not coords
  severity: "low" | "medium" | "high" | "critical";
}

const SYSTEM_PROMPT = `
You are an expert OSINT analyzer. 
Analyze the following raw report and return a tactical SITREP JSON object.

### EXTRACTION RULES:
1. **LOCATION (CRITICAL)**: 
   - Identify the specific place name, city, landmark, or building mentioned.
   - Return only the most specific name found (e.g. "Okhmatdyt Hospital" or "Kyiv city center").
   - If no specific location is found, return null.
2. **TITLE**: Tactical and brief (max 8 words).
3. **DESCRIPTION**: 1-2 sentence tactical summary.
4. **SEVERITY**: low | medium | high | critical.

### JSON TEMPLATE:
{
  "title": "...",
  "description": "...",
  "locationName": "string | null",
  "severity": "..."
}
`;

export async function parseRawIntel(rawText: string): Promise<ParsedIntel | null> {
  const provider = await getRuntimeProvider();
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return parseWithOpenAI(rawText);
  }
  return parseWithGemini(rawText);
}

async function parseWithOpenAI(rawText: string): Promise<ParsedIntel | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: rawText }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) return null;
    return JSON.parse(content) as ParsedIntel;
  } catch (error: unknown) {
    const err = error as { status?: number };
    if (err.status === 429) throw error;
    console.error("OpenAI Parsing Error:", error);
    return null;
  }
}

async function parseWithGemini(rawText: string): Promise<ParsedIntel | null> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const prompt = `${SYSTEM_PROMPT}\n\nRAW INTEL TO PARSE:\n${rawText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error: unknown) {
    const err = error as { status?: number; message?: string };
    const isQuotaError = err.status === 429 || err.message?.includes("429");

    if (isQuotaError) {
      throw error;
    }
    console.error("Gemini Parsing Error (Non-Quota):", error);
    return null;
  }
}
