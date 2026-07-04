import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

// List user's conversations
export async function GET() {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const conversations = await db.all(
    `SELECT c.*,
            i.title as item_title, i.images as item_images, i.price as item_price,
            buyer.username as buyer_username,
            seller.username as seller_username,
            (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
            (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_at
     FROM conversations c
     JOIN users buyer ON c.buyer_id = buyer.id
     JOIN users seller ON c.seller_id = seller.id
     JOIN items i ON c.item_id = i.id
     WHERE c.buyer_id = ? OR c.seller_id = ?
     ORDER BY last_message_at DESC NULLS LAST, c.created_at DESC`,
    user.id, user.id
  );

  return NextResponse.json({ conversations });
}

// Create a new conversation
export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { item_id, seller_id, message } = await req.json();

    if (!item_id || !seller_id || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (user.id === seller_id) {
      return NextResponse.json({ error: "You can't message yourself" }, { status: 400 });
    }

    // Check or create conversation
    let conv = await db.get(
      "SELECT * FROM conversations WHERE item_id = ? AND buyer_id = ?",
      item_id, user.id
    );

    if (!conv) {
      const result = await db.run(
        "INSERT INTO conversations (item_id, buyer_id, seller_id) VALUES (?, ?, ?)",
        item_id, user.id, seller_id
      );
      conv = await db.get("SELECT * FROM conversations WHERE id = ?", result.lastInsertRowid);
    }

    // Send the first message
    await db.run(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)",
      conv.id, user.id, message
    );

    return NextResponse.json({ conversation: conv }, { status: 201 });
  } catch (error) {
    console.error("Conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
