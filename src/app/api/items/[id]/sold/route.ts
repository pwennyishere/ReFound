import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  // Check item exists and user is the seller
  const item = await db.get("SELECT * FROM items WHERE id = ?", Number(id));
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.seller_id !== user.id) {
    return NextResponse.json({ error: "Only the seller can mark items as sold" }, { status: 403 });
  }

  if (item.sold_at) {
    return NextResponse.json({ error: "Item is already marked as sold" }, { status: 400 });
  }

  // Mark as sold
  await db.run("UPDATE items SET sold_at = NOW() WHERE id = ?", Number(id));

  return NextResponse.json({ success: true, message: "Item marked as sold!" });
}
