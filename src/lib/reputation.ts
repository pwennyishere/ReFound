import db from "./db";

export async function getSellerReputation(sellerId: number): Promise<{ average: number; count: number }> {
  const result = await db.get(
    "SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE seller_id = ?",
    sellerId
  );

  return {
    average: result?.avg ? Math.round(Number(result.avg) * 10) / 10 : 0,
    count: result?.cnt ? Number(result.cnt) : 0,
  };
}

export function getReputationBadge(average: number, count: number): string {
  if (count === 0) return "New Seller";
  if (average >= 4.5 && count >= 10) return "🌟 Highly Rated";
  if (average >= 4.0 && count >= 5) return "✨ Trusted Seller";
  if (average >= 3.0) return "👍 Reliable";
  return "🆕 New Seller";
}
