"use client";

import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { Store, User, LogOut, PlusCircle, Home, Menu, X, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-tavern-tan/30 bg-gradient-to-b from-tavern-dark to-[#1a0f0a] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🏮</span>
            <span className="font-serif text-xl font-bold text-tavern-gold group-hover:text-tavern-cream transition-colors">
              ReFound
            </span>
            <span className="hidden sm:inline text-xs text-tavern-cream/50 font-serif italic">
              — The Tavern Market
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-1 text-tavern-cream/70 hover:text-tavern-gold transition-colors text-sm"
            >
              <Home size={16} />
              Market Square
            </Link>

            {!loading && user ? (
              <>
                <Link
                  href="/sell"
                  className="flex items-center gap-1 text-tavern-cream/70 hover:text-tavern-gold transition-colors text-sm"
                >
                  <PlusCircle size={16} />
                  Sell
                </Link>
                <Link
                  href="/messages"
                  className="flex items-center gap-1 text-tavern-cream/70 hover:text-tavern-gold transition-colors text-sm"
                >
                  <MessageCircle size={16} />
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-1 text-tavern-cream/70 hover:text-tavern-gold transition-colors text-sm"
                >
                  <User size={16} />
                  {user.username}
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-tavern-red/70 hover:text-tavern-red transition-colors text-sm"
                >
                  <LogOut size={16} />
                  Leave
                </button>
              </>
            ) : !loading ? (
              <Link
                href="/auth"
                className="tavern-btn text-sm py-2 px-4"
              >
                <Store size={16} className="inline mr-1" />
                Enter Tavern
              </Link>
            ) : null}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden text-tavern-cream"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 text-tavern-cream/70 hover:text-tavern-gold" onClick={() => setMobileMenuOpen(false)}>
              🏠 Market Square
            </Link>
            {user ? (
              <>
                <Link href="/sell" className="block py-2 text-tavern-cream/70 hover:text-tavern-gold" onClick={() => setMobileMenuOpen(false)}>
                  ➕ Sell an Item
                </Link>
                <Link href="/messages" className="block py-2 text-tavern-cream/70 hover:text-tavern-gold" onClick={() => setMobileMenuOpen(false)}>
                  💬 Messages
                </Link>
                <Link href="/profile" className="block py-2 text-tavern-cream/70 hover:text-tavern-gold" onClick={() => setMobileMenuOpen(false)}>
                  👤 {user.username}
                </Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block py-2 text-tavern-red/70">
                  🚪 Leave
                </button>
              </>
            ) : (
              <Link href="/auth" className="block py-2 text-tavern-gold" onClick={() => setMobileMenuOpen(false)}>
                🍺 Enter Tavern
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
