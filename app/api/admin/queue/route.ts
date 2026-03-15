import { db } from "@/lib/db";
import { pendingEvents } from "@/lib/schema";
import { desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const queue = await db.select({
      id: pendingEvents.id,
      rawSource: pendingEvents.rawSource,
      suggestedTitle: pendingEvents.suggestedTitle,
      suggestedDescription: pendingEvents.suggestedDescription,
      status: pendingEvents.status,
      createdAt: pendingEvents.createdAt,
      lng: sql<number | null>`ST_X(${pendingEvents.suggestedCoordinates})`,
      lat: sql<number | null>`ST_Y(${pendingEvents.suggestedCoordinates})`,
    })
    .from(pendingEvents)
    .orderBy(desc(pendingEvents.createdAt));

    return NextResponse.json(queue);
  } catch (error) {
    console.error("Failed to fetch moderation queue:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
