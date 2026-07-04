import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { item_id, starting_bid, ends_at } = await req.json();

    if (!item_id || !starting_bid || !ends_at) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify item belongs to user
    const item = await db.get("SELECT * FROM items WHERE id = ? AND seller_id = ?", item_id, user.id);
    if (!item) {
      return NextResponse.json({ error: "Item not found or not yours" }, { status: 404 });
    }

    // Mark item as auction
    await db.run("UPDATE items SET is_auction = 1 WHERE id = ?", item_id);

    const result = await db.run(
      "INSERT INTO auctions (item_id, starting_bid, current_bid, ends_at) VALUES (?, ?, ?, ?)",
      item_id, starting_bid, starting_bid, ends_at
    );

    const auction = await db.get("SELECT * FROM auctions WHERE id = ?", result.lastInsertRowid);
    return NextResponse.json({ auction }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 });
  }
}

// Resolve expired auctions (called periodically or on page load)
export async function GET() {
  const now = new Date().toISOString();
  const expired = await db.all(
    "SELECT * FROM auctions WHERE is_active = 1 AND ends_at < ?",
    now
  );

  for (const auction of expired) {
    await db.run("UPDATE auctions SET is_active = 0, winner_id = bidder_id WHERE id = ?", auction.id);
    if (auction.bidder_id) {
      await db.run("UPDATE items SET sold_at = NOW() WHERE id = ?", auction.item_id);
    }
  }

  return NextResponse.json({ resolved: expired.length });
}
