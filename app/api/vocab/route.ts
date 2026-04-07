import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { VocabItem } from "@/lib/types";

// Collection name
const COLLECTION = "vocab";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Uses the database from the URI
    
    const vocab = await db.collection(COLLECTION)
      .find({ username })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(vocab);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch vocabulary" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, ...item } = body;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const newItem = {
      ...item,
      username,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      level: item.level || 0,
    };

    const result = await db.collection(COLLECTION).insertOne(newItem);
    
    return NextResponse.json({ ...newItem, _id: result.insertedId });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create vocabulary" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, username, ...updates } = body;

    if (!id || !username) {
      return NextResponse.json({ error: "ID and Username are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Remove _id from updates to avoid immutable field error
    const { _id, ...safeUpdates } = updates;
    
    const result = await db.collection(COLLECTION).updateOne(
      { id, username },
      { $set: { ...safeUpdates, updatedAt: Date.now() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update vocabulary" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const username = searchParams.get("username");

    if (!id || !username) {
      return NextResponse.json({ error: "ID and Username are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection(COLLECTION).deleteOne({ id, username });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete vocabulary" }, { status: 500 });
  }
}
