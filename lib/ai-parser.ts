import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getRuntimeProvider } from "@/lib/ai-provider-state";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

export interface ParsedIntel {
  title: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  severity: "low" | "medium" | "high" | "critical";
}

const SYSTEM_PROMPT = `
You are an expert OSINT (Open Source Intelligence) analyzer. 
Analyze the following raw report and return a tactical SITREP JSON object.

### EXTRACTION RULES:
1. **GEOLOCATION (CRITICAL)**: 
   - Identify the exact city, village, landmark, or tactical front mentioned.
   - Return THE MOST ACCURATE possible WGS84 decimal coordinates for that location using your internal spatial data.
   - If no specific location is found, return null for both latitude and longitude.
2. **TITLE**: Tactical and brief (max 8 words). e.g., "Missile Strike: Tel Aviv Port".
3. **DESCRIPTION**: 1-2 sentence tactical summary. Focus on "What" and "Where".
4. **SEVERITY**: low | medium | high | critical.

### JSON TEMPLATE:
{
  "title": "...",
  "description": "...",
  "latitude": number | null,
  "longitude": number | null,
  "severity": "low" | "medium" | "high" | "critical"
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
