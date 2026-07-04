"use client";

import Link from "next/link";
import { Heart, Clock, Gavel } from "lucide-react";

interface ItemCardProps {
  item: {
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
  };
  simple?: boolean;
}

export default function ItemCard({ item, simple }: ItemCardProps) {
  const images = JSON.parse(item.images || "[]");
  const firstImage = images[0] || null;
  const stars = item.seller_reputation ? Math.round(item.seller_reputation) : 0;

  const CardContent = () => (
    <>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg bg-tavern-dark/50">
        {firstImage ? (
          <img
            src={firstImage}
            alt={item.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🎨</span>
          </div>
        )}
        {item.is_auction ? (
          <span className="absolute top-2 right-2 bg-tavern-red/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Gavel size={12} /> Auction
          </span>
        ) : null}
      </div>

      {/* Info */}
      <div className={simple ? "p-6" : "p-4"}>
        <div className="flex items-start justify-between gap-2">
          <h3 className={`font-serif text-tavern-cream truncate ${simple ? "text-2xl" : "text-base"}`}>
            {item.title}
          </h3>
        </div>

        <p className={`text-tavern-gold font-bold mt-1 ${simple ? "text-3xl" : "text-lg"}`}>
          ${item.price.toFixed(2)}
        </p>

        <div className="flex items-center gap-2 mt-2 text-xs text-tavern-cream/50">
          <span className="bg-tavern-brown/50 px-2 py-0.5 rounded">
            {item.category}
          </span>
          <span>{item.condition}</span>
        </div>

        {!simple && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-tavern-tan/20 text-xs text-tavern-cream/50">
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span>{item.seller_username}</span>
              {stars > 0 && <span className="text-tavern-gold">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>}
            </div>
          </div>
        )}

        {simple && (
          <div className="mt-4 flex items-center gap-2 text-tavern-cream/60">
            <span>👤 Seller: {item.seller_username}</span>
            {stars > 0 && <span className="text-tavern-gold text-lg">{'★'.repeat(stars)}</span>}
          </div>
        )}
      </div>
    </>
  );

  return (
    <Link href={`/item/${item.id}`}>
      <div className={simple ? "tavern-card overflow-hidden" : "tavern-card overflow-hidden h-full"}>
        <CardContent />
      </div>
    </Link>
  );
}
