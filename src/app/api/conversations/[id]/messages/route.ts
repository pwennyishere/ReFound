import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

// Get messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  // Verify user is part of this conversation
  const conv = await db.get(
    "SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)",
    Number(id), user.id, user.id
  );
  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messages = await db.all(
    `SELECT m.*, u.username as sender_username
     FROM messages m
     JOIN users u ON m.sender_id = u.id
     WHERE m.conversation_id = ?
     ORDER BY m.created_at ASC`,
    Number(id)
  );

  return NextResponse.json({ messages, conversation: conv });
}

// Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const conv = await db.get(
    "SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR seller_id = ?)",
    Number(id), user.id, user.id
  );
  if (!conv) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  try {
    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const result = await db.run(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)",
      Number(id), user.id, content.trim()
    );

    const message = await db.get(
      `SELECT m.*, u.username as sender_username
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      result.lastInsertRowid
    );

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
