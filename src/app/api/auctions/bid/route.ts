import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { auction_id, amount } = await req.json();

    if (!auction_id || !amount) {
      return NextResponse.json({ error: "Auction ID and amount are required" }, { status: 400 });
    }

    const auction = await db.get("SELECT * FROM auctions WHERE id = ? AND is_active = 1", auction_id);
    if (!auction) {
      return NextResponse.json({ error: "Auction not found or expired" }, { status: 404 });
    }

    // Check if user is the seller
    const item = await db.get("SELECT seller_id FROM items WHERE id = ?", auction.item_id);
    if (item.seller_id === user.id) {
      return NextResponse.json({ error: "You can't bid on your own item" }, { status: 400 });
    }

    // Minimum increment of $0.50 or 5%
    const minBid = Math.max(auction.current_bid + 0.5, auction.current_bid * 1.05);
    if (amount < minBid) {
      return NextResponse.json({
        error: `Bid must be at least $${minBid.toFixed(2)}`,
        minimum_bid: minBid,
      }, { status: 400 });
    }

    // Place the bid
    await db.run("INSERT INTO bids (auction_id, bidder_id, amount) VALUES (?, ?, ?)",
      auction_id, user.id, amount);
    await db.run("UPDATE auctions SET current_bid = ?, bidder_id = ? WHERE id = ?",
      amount, user.id, auction_id);

    return NextResponse.json({ success: true, current_bid: amount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}
