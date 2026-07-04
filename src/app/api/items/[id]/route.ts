import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSellerReputation } from "@/lib/reputation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await db.get(`
    SELECT i.*, u.username as seller_username, u.avatar_url as seller_avatar
    FROM items i
    JOIN users u ON i.seller_id = u.id
    WHERE i.id = ?
  `, Number(id));

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const rep = await getSellerReputation(item.seller_id);
  item.seller_reputation = rep.average;
  item.seller_review_count = rep.count;

  // Get auction info if applicable
  let auction = null;
  if (item.is_auction) {
    auction = await db.get(`
      SELECT a.*, u.username as bidder_username
      FROM auctions a
      LEFT JOIN users u ON a.bidder_id = u.id
      WHERE a.item_id = ?
    `, item.id);
  }

  return NextResponse.json({ item, auction });
}
