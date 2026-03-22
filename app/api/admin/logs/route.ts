import { db } from "@/lib/db";
import { systemLogs, ingestSources } from "@/lib/schema";
import { desc, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-check";
import si from "systeminformation";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  try {
    const logs = await db.select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(mode === "export" ? 1000 : 50);

    if (mode === "export") {
      const csv = [
        ["Severity", "Module", "Message", "Timestamp"].join(","),
        ...logs.map(log => [
          log.level,
          log.module,
          `"${log.message.replace(/"/g, '""')}"`,
          log.createdAt.toISOString()
        ].join(","))
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=osint_logs_export.csv"
        }
      });
    }

    // Telemetry
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const [activeSources] = await db.select({ value: count() }).from(ingestSources).where(eq(ingestSources.isActive, true));
    const [totalSources] = await db.select({ value: count() }).from(ingestSources);

    return NextResponse.json({
      logs,
      telemetry: {
        cpuLoad: `${Math.round(cpu.currentLoad)}%`,
        memUsage: `${Math.round((mem.active / mem.total) * 100)}%`,
        activeNodes: `${activeSources.value}/${totalSources.value || 6}`
      }
    });
  } catch (error) {
    console.error("Failed to fetch system logs or telemetry:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
