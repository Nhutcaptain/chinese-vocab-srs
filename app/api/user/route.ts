import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const COLLECTION = "users";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    let user = await db.collection(COLLECTION).findOne({ username });

    if (!user) {
      // Create user if not exists
      const newUser = {
        username,
        streak: 0,
        lastStudyDate: null,
        createdAt: Date.now(),
      };
      await db.collection(COLLECTION).insertOne(newUser);
      return NextResponse.json(newUser);
    }

    return NextResponse.json(user);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, streak, lastStudyDate } = body;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection(COLLECTION).updateOne(
      { username },
      { 
        $set: { 
          streak, 
          lastStudyDate, 
          updatedAt: Date.now() 
        } 
      },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update user stats" }, { status: 500 });
  }
}
