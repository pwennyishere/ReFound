"use client";

import { useState, useEffect } from "react";
import ItemCard from "@/app/components/ItemCard";
import { useAuth } from "@/app/context/AuthContext";
import { CATEGORIES } from "@/lib/types";
import { Search, SlidersHorizontal, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface Item {
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

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { user } = useAuth();
  const isSimple = user?.is_simple_mode === 1;

  async function fetchItems() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "All") params.set("category", category);
      if (search) params.set("search", search);

      const res = await fetch(`/api/items?${params}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error("Failed to fetch items", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, [category]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchItems();
  }

  return (
    <div className={isSimple ? "simple-mode" : ""}>
      {/* Hero Banner */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center">
            <span className="text-5xl md:text-6xl">🏮</span>
            <h1 className="font-serif text-3xl md:text-5xl text-tavern-gold mt-4">
              Welcome to the Market Square
            </h1>
            <p className="text-tavern-cream/60 mt-2 text-sm md:text-lg font-serif italic max-w-xl mx-auto">
              Where forgotten treasures find new homes and every item has a story to tell.
            </p>
            <div className="tavern-divider max-w-md mx-auto mt-6" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-tavern-cream/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search the market..."
                className="tavern-input w-full pl-10"
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-tavern-cream/40" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="tavern-input"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Item Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="tavern-card p-4 animate-pulse">
                <div className="aspect-square bg-tavern-brown/30 rounded-lg mb-4" />
                <div className="h-4 bg-tavern-brown/30 rounded w-3/4 mb-2" />
                <div className="h-4 bg-tavern-brown/30 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl">🔍</span>
            <h2 className="font-serif text-xl text-tavern-cream/50 mt-4">No items found</h2>
            <p className="text-tavern-cream/30 text-sm mt-1">
              {search ? "Try a different search" : "Be the first to list something!"}
            </p>
            {user && (
              <Link href="/sell" className="tavern-btn inline-flex items-center gap-2 mt-4">
                <ShoppingBag size={16} /> List Your First Item
              </Link>
            )}
          </div>
        ) : (
          <div className={`grid ${isSimple ? "grid-cols-1 md:grid-cols-2 gap-8" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}`}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} simple={isSimple} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
