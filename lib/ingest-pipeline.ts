import { db } from "./db";
import { pendingEvents } from "./schema";
import { parseRawIntel } from "./ai-parser";
import { pointSql } from "./map-logic";
import { eq } from "drizzle-orm";
import { logSystem } from "./logging";
import { geocodeLocation } from "./geocoder";

/**
 * Common ingestion pipeline that takes raw text, 
 * stages it in the database, and calls AI for enrichment.
 */
export async function processIngestion(
  rawText: string, 
  metadata?: { externalId?: string; source?: string; sourceCreatedAt?: Date; imageUrl?: string; sourceMetadata?: Record<string, unknown> }
) {
  if (!rawText || rawText.length < 10) return null;

  // Deduplication check
  if (metadata?.externalId) {
    const existing = await db.query.pendingEvents.findFirst({
      where: eq(pendingEvents.externalId, metadata.externalId),
    });
    if (existing) {
      console.log(`⏩ Skipping duplicate intel: ${metadata.externalId}`);
      return existing.id;
    }
  }

  // Add a small delay to prevent Gemini Free Tier rate limiting (15 RPM)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 1. Store Raw Intel in Pending Queue
  console.log(`📡 New Intel Received: "${rawText.substring(0, 50)}..."`);
  
  let pending;
  try {
    const results = await db.insert(pendingEvents).values({
      rawSource: rawText,
      externalId: metadata?.externalId,
      source: metadata?.source,
      sourceCreatedAt: metadata?.sourceCreatedAt,
      imageUrl: metadata?.imageUrl,
      sourceMetadata: metadata?.sourceMetadata,
      status: "pending",
    }).returning();
    pending = results[0];
    await logSystem("info", "INGEST", `Raw intel staged: ${rawText.substring(0, 30)}...`);
    console.log(`📥 Raw event staged (ID: ${pending.id})`);
  } catch (err) {
    await logSystem("error", "INGEST", `Failed to stage intel: ${(err as Error).message}`);
    console.error("❌ Database Insertion Error:", err);
    throw err;
  }

  // 2. Initial AI Parsing with Exponential Backoff Retries
  const success = await reprocessEvent(pending.id, rawText);
  return success ? pending.id : null;
}

/**
 * Manually re-trigger AI parsing for an existing pending event.
 */
export async function reprocessEvent(id: string, rawText: string) {
  console.log(`🤖 Reprocessing Intel ${id} with Gemini-2.0-Flash...`);
  
  // Update status to processing to give UI early feedback
  await db.update(pendingEvents)
    .set({ status: "processing" })
    .where(eq(pendingEvents.id, id));
  
  let parsed = null;
  let attempts = 0;
  const maxAttempts = 1;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      parsed = await parseRawIntel(rawText);
      if (parsed) break; // Success!
    } catch (err: unknown) {
      if (attempts === maxAttempts) {
        await logSystem("error", "AI", `Final parsing attempt failed for ${id}: ${(err as Error).message}`);
        console.error("❌ AI Pipeline Error after 3 attempts:", err);
      } else {
        // Respect Gemini's retry delay if provided, else exponential backoff
        const errorData = err as { retryDelay?: string };
        const retryAfter = errorData.retryDelay ? parseInt(errorData.retryDelay) * 1000 : attempts * 15000;
        console.warn(`⏳ AI Rate Limited. Retrying in ${retryAfter/1000}s... (Attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
      }
    }
  }

  try {
    if (parsed) {
      // Stage 2: Specialized Geocoding
      let lat: number | null = null;
      let lng: number | null = null;
      
      if (parsed.locationName) {
        console.log(`🔎 Geocoding extracted location: "${parsed.locationName}"`);
        const coords = await geocodeLocation(parsed.locationName);
        if (coords) {
          lat = coords.lat;
          lng = coords.lng;
          console.log(`🎯 Surgical coordinates: ${lat}, ${lng}`);
        } else {
          console.warn(`⚠️ No surgical coordinates found for: ${parsed.locationName}`);
        }
      }

      await db.update(pendingEvents)
        .set({
          suggestedTitle: parsed.title,
          suggestedDescription: parsed.description,
          suggestedCoordinates: (lat !== null && lng !== null) 
            ? pointSql(lng, lat) 
            : null,
          status: "processed",
        })
        .where(eq(pendingEvents.id, id));
        
      await logSystem("info", "AI", `Parsed content for intel ${id}. Location: ${parsed.locationName || "None"}. Coords: ${lat}, ${lng}`);
      console.log("✅ AI metadata attached.");
      return true;
    } else {
      await db.update(pendingEvents)
        .set({ status: "failed" })
        .where(eq(pendingEvents.id, id));
        
      await logSystem("warn", "AI", `No location extracted for intel ${id} after all attempts.`);
      console.warn("⚠️ AI parsing failed to extract coordinates.");
      return false;
    }
  } catch (err) {
    await logSystem("error", "AI", `Database update failure for ${id}: ${(err as Error).message}`);
    console.error("❌ Database Update Error:", err);
    return false;
  }
}
