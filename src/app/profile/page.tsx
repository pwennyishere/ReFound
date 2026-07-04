"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import ItemCard from "@/app/components/ItemCard";
import ReviewStars from "@/app/components/ReviewStars";
import { User, Store, Settings, ToggleLeft, ToggleRight, Package } from "lucide-react";
import Link from "next/link";

interface ProfileItem {
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
  sold_at: string | null;
}

export default function ProfilePage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const router = useRouter();
  const [myItems, setMyItems] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingMode, setTogglingMode] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }
    if (user) {
      loadMyItems();
    }
  }, [user, authLoading]);

  async function loadMyItems() {
    try {
      const res = await fetch(`/api/items?seller_id=${user!.id}`);
      const data = await res.json();
      setMyItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSimpleMode() {
    if (!user) return;
    setTogglingMode(true);
    const newMode = user.is_simple_mode === 1 ? 0 : 1;

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_simple_mode: newMode }),
      });

      if (res.ok) {
        user.is_simple_mode = newMode;
        await refresh();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingMode(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-tavern-gold text-xl animate-pulse">🔮 Loading...</div>
      </div>
    );
  }

  const isSimple = user.is_simple_mode === 1;

  return (
    <div className={isSimple ? "simple-mode" : ""}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="tavern-card p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-tavern-gold/20 flex items-center justify-center mx-auto md:mx-0">
              <User size={40} className="text-tavern-gold" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-serif text-2xl md:text-3xl text-tavern-gold">
                {user.username}
              </h1>
              <p className="text-tavern-cream/40 text-sm">{user.email}</p>
              <p className="text-tavern-cream/30 text-xs mt-1">
                Merchant since {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Simple mode toggle */}
            <div className="flex items-center gap-3 bg-tavern-brown/20 p-4 rounded-lg">
              <Settings size={20} className="text-tavern-cream/40" />
              <div>
                <p className="text-sm text-tavern-cream/70">Simple Stall Mode</p>
                <p className="text-xs text-tavern-cream/40">
                  {isSimple ? "Big & easy view" : "Standard view"}
                </p>
              </div>
              <button
                onClick={toggleSimpleMode}
                disabled={togglingMode}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isSimple ? "bg-tavern-gold" : "bg-tavern-brown"
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isSimple ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex gap-4 mb-8">
          <Link href="/sell" className="tavern-btn flex items-center gap-2">
            <Store size={16} /> List New Item
          </Link>
          <Link href={`/shop/${user.id}`} className="tavern-btn-secondary flex items-center gap-2">
            <Package size={16} /> View My Stall
          </Link>
        </div>

        {/* My Items */}
        <h2 className="font-serif text-xl text-tavern-cream/70 mb-4">📦 My Items</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="tavern-card p-4 animate-pulse">
                <div className="aspect-square bg-tavern-brown/30 rounded-lg mb-4" />
                <div className="h-4 bg-tavern-brown/30 rounded w-3/4 mb-2" />
                <div className="h-4 bg-tavern-brown/30 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : myItems.length === 0 ? (
          <div className="text-center py-12 text-tavern-cream/30">
            <span className="text-4xl">🏪</span>
            <p className="mt-2">You haven&apos;t listed any items yet.</p>
            <Link href="/sell" className="tavern-btn inline-flex items-center gap-2 mt-4">
              <Store size={16} /> List Your First Item
            </Link>
          </div>
        ) : (
          <div className={`grid ${isSimple ? "grid-cols-1 md:grid-cols-2 gap-8" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"}`}>
            {myItems.map((item) => (
              <div key={item.id} className="relative">
                <ItemCard item={item} simple={isSimple} />
                {item.sold_at && (
                  <div className="absolute top-2 left-2 bg-tavern-red/90 text-white text-xs px-2 py-1 rounded-full">
                    Sold
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
