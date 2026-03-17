import { db } from "./db";
import { systemSettings } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Shared state for runtime AI provider preference.
 * Values are stored in the database so both the API route (Next.js)
 * and the Telegram Ingestor (separate process) share the same toggle.
 */

let cachedProvider: string | null = null;
let lastFetched = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function getRuntimeProvider(): Promise<string> {
  const now = Date.now();
  
  if (cachedProvider && (now - lastFetched < CACHE_TTL)) {
    return cachedProvider;
  }

  try {
    const setting = await db.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "ai_provider"),
    });

    if (setting) {
      cachedProvider = setting.value;
    } else {
      cachedProvider = process.env.AI_PROVIDER || "gemini";
    }
  } catch (error) {
    console.warn("⚠️ Failed to fetch AI provider from DB, falling back to ENV:", error);
    cachedProvider = process.env.AI_PROVIDER || "gemini";
  }

  lastFetched = now;
  return cachedProvider;
}

export async function setRuntimeProvider(provider: string): Promise<void> {
  try {
    await db.insert(systemSettings)
      .values({ key: "ai_provider", value: provider })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: provider },
      });
    
    cachedProvider = provider;
    lastFetched = Date.now();
  } catch (error) {
    console.error("❌ Failed to update AI provider in DB:", error);
    throw error;
  }
}
