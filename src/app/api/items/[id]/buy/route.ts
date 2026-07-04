import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { card_number, card_name, card_expiry, card_cvv } = await req.json();

    // Basic card validation
    if (!card_number || !card_name || !card_expiry || !card_cvv) {
      return NextResponse.json({ error: "All card fields are required" }, { status: 400 });
    }

    const cleanNumber = card_number.replace(/\s/g, "");
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return NextResponse.json({ error: "Invalid card number" }, { status: 400 });
    }

    if (card_cvv.length < 3 || card_cvv.length > 4) {
      return NextResponse.json({ error: "Invalid CVV" }, { status: 400 });
    }

    // Get item
    const item = await db.get(
      "SELECT * FROM items WHERE id = ? AND sold_at IS NULL",
      Number(id)
    );

    if (!item) {
      return NextResponse.json({ error: "Item not found or already sold" }, { status: 404 });
    }

    if (item.seller_id === user.id) {
      return NextResponse.json({ error: "You can't buy your own item" }, { status: 400 });
    }

    // If it's an active auction, can't buy directly
    if (item.is_auction) {
      const auction = await db.get(
        "SELECT * FROM auctions WHERE item_id = ? AND is_active = 1",
        item.id
      );
      if (auction) {
        return NextResponse.json({ error: "This item is up for auction — place a bid instead" }, { status: 400 });
      }
    }

    // Process purchase (simulated card payment)
    // In a real app, you'd charge the card via Stripe here
    const transactionId = "TXN-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Mark item as sold
    await db.run("UPDATE items SET sold_at = NOW() WHERE id = ?", item.id);

    return NextResponse.json({
      success: true,
      transaction_id: transactionId,
      message: "Payment successful! Item purchased.",
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}
