import "dotenv/config";
import { db } from "./lib/db";
import { publishedEvents, pendingEvents } from "./lib/schema";

async function countData() {
  const publishedCount = await db.select().from(publishedEvents);
  const pendingCount = await db.select().from(pendingEvents);
  
  console.log(`📊 Current Database Stats:`);
  console.log(`- Published Events: ${publishedCount.length}`);
  console.log(`- Pending Events (in Queue): ${pendingCount.length}`);
  
  if (publishedCount.length > 0) {
    console.log("\n📍 Sample Published Event:");
    console.log(JSON.stringify(publishedCount[0], null, 2));
  }
  
  process.exit(0);
}

countData();
