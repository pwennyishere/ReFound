"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import ItemCard from "@/app/components/ItemCard";
import ReviewStars from "@/app/components/ReviewStars";
import { getReputationBadge } from "@/lib/reputation";
import { Store, Star, User } from "lucide-react";

interface ShopItem {
  id: number;
  title: string;
  price: number;
  images: string;
  category: string;
  condition: string;
  is_auction: number;
  seller_username: string;
  seller_reputation: number;
  created_at: string;
}

interface Review {
  id: number;
  reviewer_username: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ShopPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerName, setSellerName] = useState("");
  const [loading, setLoading] = useState(true);
  const isSimple = user?.is_simple_mode === 1;

  useEffect(() => {
    async function load() {
      try {
        const itemsRes = await fetch(`/api/items?seller_id=${id}`);
        const itemsData = await itemsRes.json();
        setItems(itemsData.items || []);
        if (itemsData.items?.[0]) {
          setSellerName(itemsData.items[0].seller_username);
        }

        const revRes = await fetch(`/api/reviews?seller_id=${id}`);
        const revData = await revRes.json();
        setReviews(revData.reviews || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Calculate reputation
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;
  const badge = reviews.length === 0 ? "New Seller"
    : avgRating >= 4.5 && reviews.length >= 10 ? "🌟 Highly Rated"
    : avgRating >= 4.0 && reviews.length >= 5 ? "✨ Trusted Seller"
    : avgRating >= 3.0 ? "👍 Reliable"
    : "🆕 New Seller";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-tavern-gold text-xl animate-pulse">🔮 Visiting the stall...</div>
      </div>
    );
  }

  return (
    <div className={isSimple ? "simple-mode" : ""}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Shop Header */}
        <div className="tavern-card p-6 md:p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-tavern-gold/20 flex items-center justify-center">
              <Store size={32} className="text-tavern-gold" />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-tavern-gold">
                {sellerName || "Merchant"}&apos;s Stall
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1">
                  <ReviewStars rating={avgRating} size="sm" />
                  <span className="text-tavern-cream/50 text-sm">({reviews.length})</span>
                </div>
                <span className="text-tavern-cream/40 text-sm">•</span>
                <span className="text-tavern-cream/60 text-sm">{badge}</span>
              </div>
              <p className="text-tavern-cream/40 text-sm mt-1">
                {items.length} item{items.length !== 1 ? 's' : ''} for sale
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <h2 className="font-serif text-xl text-tavern-cream/70 mb-4">📦 Items for Sale</h2>
        {items.length === 0 ? (
          <div className="text-center py-12 text-tavern-cream/30">
            <span className="text-4xl">🏪</span>
            <p className="mt-2">No items listed yet.</p>
          </div>
        ) : (
          <div className={`grid ${isSimple ? "grid-cols-1 md:grid-cols-2 gap-8" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}`}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} simple={isSimple} />
            ))}
          </div>
        )}

        {/* Reviews */}
        <div className="mt-12">
          <div className="tavern-divider" />
          <h2 className="font-serif text-xl text-tavern-gold mb-6">📝 Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-4 max-w-2xl">
              {reviews.map((review) => (
                <div key={review.id} className="tavern-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-tavern-cream/40" />
                      <span className="text-tavern-cream font-medium">{review.reviewer_username}</span>
                      <ReviewStars rating={review.rating} size="sm" />
                    </div>
                    <span className="text-xs text-tavern-cream/30">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-tavern-cream/60 text-sm ml-6">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-tavern-cream/30 text-sm">No reviews yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
