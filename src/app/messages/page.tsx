"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { MessageCircle, ArrowLeft, User } from "lucide-react";

interface Conversation {
  id: number;
  item_id: number;
  buyer_id: number;
  seller_id: number;
  item_title: string;
  item_images: string;
  item_price: number;
  buyer_username: string;
  seller_username: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_username: string;
  content: string;
  created_at: string;
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }
    if (user) loadConversations();
  }, [user, authLoading]);

  async function loadConversations() {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function selectConversation(conv: Conversation) {
    setSelectedConv(conv);
    setMessages([]);
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      // Refresh conversation list
      loadConversations();
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  }

  const isSimple = user?.is_simple_mode === 1;

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-tavern-gold text-xl animate-pulse">🔮 Loading...</div></div>;
  }

  const otherUser = (conv: Conversation) =>
    user?.id === conv.buyer_id ? conv.seller_username : conv.buyer_username;

  return (
    <div className={isSimple ? "simple-mode" : ""}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle size={24} className="text-tavern-gold" />
          <h1 className="font-serif text-2xl text-tavern-gold">Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: "60vh" }}>
          {/* Conversation List */}
          <div className="tavern-card md:col-span-1 p-0 overflow-hidden">
            <div className="p-3 border-b border-tavern-tan/20">
              <h2 className="text-sm text-tavern-cream/60 font-serif">Conversations</h2>
            </div>
            {loading ? (
              <div className="p-4 text-tavern-cream/30 text-sm">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-tavern-cream/30 text-sm">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                No conversations yet. Start by contacting a seller!
              </div>
            ) : (
              <div className="divide-y divide-tavern-tan/10 max-h-[70vh] overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full text-left p-3 hover:bg-tavern-brown/20 transition-colors ${
                      selectedConv?.id === conv.id ? "bg-tavern-brown/30" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-tavern-gold/20 flex items-center justify-center shrink-0">
                        <User size={14} className="text-tavern-gold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-tavern-cream truncate">{otherUser(conv)}</p>
                        <p className="text-xs text-tavern-cream/40 truncate">{conv.item_title}</p>
                        {conv.last_message && (
                          <p className="text-xs text-tavern-cream/30 truncate mt-0.5">{conv.last_message}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="tavern-card md:col-span-2 p-0 overflow-hidden flex flex-col" style={{ minHeight: "60vh" }}>
            {!selectedConv ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <MessageCircle size={48} className="mx-auto text-tavern-cream/20 mb-3" />
                  <p className="text-tavern-cream/40 text-sm">Select a conversation to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-3 border-b border-tavern-tan/20 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-tavern-gold/20 flex items-center justify-center">
                    <User size={14} className="text-tavern-gold" />
                  </div>
                  <div>
                    <p className="text-sm text-tavern-cream font-medium">{otherUser(selectedConv)}</p>
                    <Link href={`/item/${selectedConv.item_id}`} className="text-xs text-tavern-gold hover:underline">
                      {selectedConv.item_title} — ${selectedConv.item_price.toFixed(2)}
                    </Link>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ maxHeight: "50vh" }}>
                  {messages.length === 0 ? (
                    <p className="text-tavern-cream/30 text-sm text-center py-8">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              isMe
                                ? "bg-tavern-gold/20 border border-tavern-gold/30 text-tavern-cream"
                                : "bg-tavern-brown/30 border border-tavern-tan/20 text-tavern-cream"
                            }`}
                          >
                            <p className="text-xs text-tavern-cream/40 mb-1">
                              {isMe ? "You" : msg.sender_username}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-xs text-tavern-cream/30 mt-1 text-right">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message input */}
                <form onSubmit={sendMessage} className="p-3 border-t border-tavern-tan/20">
                  {error && <p className="text-tavern-red text-xs mb-2">⚠️ {error}</p>}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="tavern-input flex-1 text-sm"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="tavern-btn text-sm px-4"
                    >
                      {sending ? "..." : "Send"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
