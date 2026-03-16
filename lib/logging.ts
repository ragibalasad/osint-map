import { db } from "./db";
import { systemLogs } from "./schema";

export async function logSystem(level: "info" | "warn" | "error", module: string, message: string) {
  try {
    await db.insert(systemLogs).values({
      level,
      module,
      message,
    });
    console.log(`[${level.toUpperCase()}] [${module}] ${message}`);
  } catch (err) {
    console.error("Failed to write system log:", err);
  }
}
