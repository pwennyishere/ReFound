import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { seller_id, item_id, rating, comment } = await req.json();

    if (!seller_id || !item_id || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
    }

    // Check if user bought this item (item is sold)
    const item = await db.get("SELECT * FROM items WHERE id = ? AND sold_at IS NOT NULL", item_id);
    if (!item) {
      return NextResponse.json({ error: "Item hasn't been sold yet" }, { status: 400 });
    }

    // Check for duplicate review
    const existing = await db.get("SELECT id FROM reviews WHERE reviewer_id = ? AND item_id = ?", user.id, item_id);
    if (existing) {
      return NextResponse.json({ error: "You already reviewed this item" }, { status: 409 });
    }

    await db.run(
      "INSERT INTO reviews (reviewer_id, seller_id, item_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      user.id, seller_id, item_id, rating, comment || ""
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const seller_id = searchParams.get("seller_id");

  if (!seller_id) {
    return NextResponse.json({ error: "seller_id required" }, { status: 400 });
  }

  const reviews = await db.all(`
    SELECT r.*, u.username as reviewer_username
    FROM reviews r
    JOIN users u ON r.reviewer_id = u.id
    WHERE r.seller_id = ?
    ORDER BY r.created_at DESC
  `, Number(seller_id));

  return NextResponse.json({ reviews });
}
