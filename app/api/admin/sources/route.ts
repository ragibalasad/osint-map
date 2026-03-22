import { db } from "@/lib/db";
import { ingestSources } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-check";

export async function GET() {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const sources = await db.query.ingestSources.findMany({
    orderBy: (sources, { desc }) => [desc(sources.createdAt)]
  });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const { type, value, name } = await req.json();
  if (!type || !value) return new NextResponse("Missing fields", { status: 400 });
  
  const [newSource] = await db.insert(ingestSources).values({
    type,
    value,
    name: name || value,
    isActive: true
  }).returning();
  
  return NextResponse.json(newSource);
}

export async function DELETE(req: Request) {
  if (!(await isAdmin())) return new NextResponse("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });
  
  await db.delete(ingestSources).where(eq(ingestSources.id, id));
  return new NextResponse("Deleted", { status: 200 });
}
