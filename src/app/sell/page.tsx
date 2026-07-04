"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { CATEGORIES, CONDITIONS } from "@/lib/types";

export default function SellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[2]);
  const [isAuction, setIsAuction] = useState(false);
  const [startingBid, setStartingBid] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("3");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="tavern-card p-8 text-center max-w-md">
          <span className="text-4xl">🔒</span>
          <h2 className="font-serif text-xl text-tavern-gold mt-2">Must Enter the Tavern First</h2>
          <p className="text-tavern-cream/50 mt-1">Sign in to sell your treasures</p>
          <button onClick={() => router.push("/auth")} className="tavern-btn mt-4">
            Enter Tavern
          </button>
        </div>
      </div>
    );
  }

  function addImageField() {
    setImageUrls([...imageUrls, ""]);
  }

  function updateImage(index: number, value: string) {
    const updated = [...imageUrls];
    updated[index] = value;
    setImageUrls(updated);
  }

  function removeImage(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const validImages = imageUrls.filter((url) => url.trim());

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          images: validImages,
          category,
          condition,
          is_auction: isAuction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      // If auction, create auction too
      if (isAuction && startingBid) {
        const endsAt = new Date();
        endsAt.setDate(endsAt.getDate() + parseInt(auctionDuration));
        endsAt.setHours(23, 59, 59, 0);

        await fetch("/api/auctions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: data.item.id,
            starting_bid: parseFloat(startingBid),
            ends_at: endsAt.toISOString(),
          }),
        });
      }

      setSuccess(true);
      setTimeout(() => router.push(`/item/${data.item.id}`), 1500);
    } catch {
      setError("Failed to list item. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="tavern-card p-8 text-center max-w-md">
          <span className="text-5xl">✨</span>
          <h2 className="font-serif text-2xl text-tavern-gold mt-2">Item Listed!</h2>
          <p className="text-tavern-cream/60 mt-1">Your treasure is now in the Market Square</p>
          <div className="mt-4 animate-pulse text-tavern-cream/40">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl">📦</span>
          <h1 className="font-serif text-3xl text-tavern-gold mt-2">List Your Treasure</h1>
          <p className="text-tavern-cream/50 text-sm font-serif italic">
            Give your pre-loved items a new home
          </p>
          <div className="tavern-divider max-w-xs mx-auto mt-4" />
        </div>

        <form onSubmit={handleSubmit} className="tavern-card p-6 md:p-8 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">Item Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="tavern-input w-full"
              placeholder="e.g. Vintage Oak Desk, 1960s"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">Tale of the Item</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="tavern-input w-full h-32 resize-none"
              placeholder="Describe your item — its history, condition, story..."
            />
          </div>

          {/* Price & Category row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="tavern-input w-full"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="tavern-input w-full"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">Condition</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c)}
                  className={`p-2 rounded-lg text-sm transition-all ${
                    condition === c
                      ? "bg-tavern-gold/20 border border-tavern-gold text-tavern-gold"
                      : "bg-tavern-dark border border-tavern-tan/20 text-tavern-cream/50 hover:border-tavern-tan/50"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">Images (URLs)</label>
            {imageUrls.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateImage(i, e.target.value)}
                  className="tavern-input flex-1"
                  placeholder="https://example.com/photo.jpg"
                />
                {imageUrls.length > 1 && (
                  <button type="button" onClick={() => removeImage(i)} className="text-tavern-red/50 hover:text-tavern-red px-2">
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addImageField} className="text-sm text-tavern-gold hover:underline">
              + Add another image
            </button>
          </div>

          {/* Auction toggle */}
          <div className="border-t border-tavern-tan/20 pt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAuction}
                onChange={(e) => setIsAuction(e.target.checked)}
                className="w-5 h-5 accent-tavern-gold"
              />
              <span className="font-serif text-tavern-cream">
                🏷️ Make this an auction
              </span>
            </label>

            {isAuction && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">Starting Bid ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={startingBid}
                    onChange={(e) => setStartingBid(e.target.value)}
                    className="tavern-input w-full"
                    placeholder="0.00"
                    required={isAuction}
                  />
                </div>
                <div>
                  <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">Duration</label>
                  <select
                    value={auctionDuration}
                    onChange={(e) => setAuctionDuration(e.target.value)}
                    className="tavern-input w-full"
                  >
                    <option value="1">1 Day</option>
                    <option value="3">3 Days</option>
                    <option value="7">7 Days</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-tavern-red/10 border border-tavern-red/30 rounded-lg p-3 text-sm text-tavern-red">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="tavern-btn w-full flex items-center justify-center gap-2"
          >
            {loading ? "⏳ Listing..." : "📯 List in Market Square"}
          </button>
        </form>
      </div>
    </div>
  );
}
