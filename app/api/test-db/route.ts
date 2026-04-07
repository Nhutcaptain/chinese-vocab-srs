import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("chinese-vocab");
    
    // Test connection by fetching a single document or just checking status
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({ 
      status: "Connected", 
      database: db.databaseName,
      collections: collections.map(c => c.name)
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ status: "Error", error: String(e) }, { status: 500 });
  }
}
