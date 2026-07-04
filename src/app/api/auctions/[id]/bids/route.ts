import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const bids = await db.all(`
    SELECT b.*, u.username as bidder_username
    FROM bids b
    JOIN users u ON b.bidder_id = u.id
    WHERE b.auction_id = ?
    ORDER BY b.created_at DESC
  `, Number(id));

  return NextResponse.json({ bids });
}
