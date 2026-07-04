"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Store, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { refresh } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/signup";
      const body = isLogin ? { email, password } : { username, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      await refresh();
      router.push("/");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Tavern Sign */}
        <div className="text-center mb-8">
          <span className="text-5xl">🏮</span>
          <h1 className="font-serif text-3xl text-tavern-gold mt-2">
            {isLogin ? "Welcome Back, Traveler" : "Join the Tavern"}
          </h1>
          <p className="text-tavern-cream/50 text-sm mt-1 font-serif italic">
            {isLogin ? "Pull up a chair and browse" : "Create your merchant stall"}
          </p>
          <div className="tavern-divider max-w-xs mx-auto mt-4" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="tavern-card p-8 space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">
                <User size={14} className="inline mr-1" /> Merchant Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="tavern-input w-full"
                placeholder="e.g. MerchantJane"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">
              <Mail size={14} className="inline mr-1" /> Raven Post (Email)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="tavern-input w-full"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-tavern-cream/70 mb-1 font-serif">
              <Lock size={14} className="inline mr-1" /> Secret Key
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="tavern-input w-full pr-10"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tavern-cream/40 hover:text-tavern-cream"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
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
            {loading ? (
              <span className="animate-pulse">⏳ Opening the door...</span>
            ) : (
              <>
                <Store size={18} />
                {isLogin ? "Enter the Tavern" : "Open Your Stall"}
              </>
            )}
          </button>

          <div className="text-center text-sm text-tavern-cream/50">
            {isLogin ? (
              <span>
                New here?{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(""); }}
                  className="text-tavern-gold hover:underline"
                >
                  Open a stall
                </button>
              </span>
            ) : (
              <span>
                Already a merchant?{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(""); }}
                  className="text-tavern-gold hover:underline"
                >
                  Return to tavern
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
