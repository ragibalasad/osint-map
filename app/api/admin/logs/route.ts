import { db } from "@/lib/db";
import { systemLogs } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-check";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const logs = await db.select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(50);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch system logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
