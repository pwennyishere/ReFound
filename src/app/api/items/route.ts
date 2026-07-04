import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getSellerReputation } from "@/lib/reputation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const sellerId = searchParams.get("seller_id");

  let query = `
    SELECT i.*, u.username as seller_username, u.avatar_url as seller_avatar
    FROM items i
    JOIN users u ON i.seller_id = u.id
    WHERE i.sold_at IS NULL
  `;
  const params: any[] = [];

  if (category && category !== "All") {
    query += " AND i.category = ?";
    params.push(category);
  }

  if (search) {
    query += " AND (i.title ILIKE ? OR i.description ILIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  if (sellerId) {
    query += " AND i.seller_id = ?";
    params.push(Number(sellerId));
  }

  query += " ORDER BY i.created_at DESC LIMIT 50";

  const items = await db.all(query, ...params);

  // Add reputation to each item
  const itemsWithRep = await Promise.all(items.map(async (item: any) => {
    const rep = await getSellerReputation(item.seller_id);
    return { ...item, seller_reputation: rep.average, seller_review_count: rep.count };
  }));

  return NextResponse.json({ items: itemsWithRep });
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { title, description, price, images, category, condition, is_auction } = await req.json();

    if (!title || !price) {
      return NextResponse.json({ error: "Title and price are required" }, { status: 400 });
    }

    const result = await db.run(
      `INSERT INTO items (seller_id, title, description, price, images, category, condition, is_auction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      user.id, title, description || "", price, JSON.stringify(images || []), category || "Other", condition || "Good", is_auction ? 1 : 0
    );

    const item = await db.get("SELECT * FROM items WHERE id = ?", result.lastInsertRowid);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
