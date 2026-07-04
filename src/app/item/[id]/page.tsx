"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import AuctionTimer from "@/app/components/AuctionTimer";
import ReviewStars from "@/app/components/ReviewStars";
import { ArrowLeft, Gavel, User, ShoppingCart, CreditCard, X, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ItemData {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string;
  category: string;
  condition: string;
  is_auction: number;
  seller_id: number;
  seller_username: string;
  seller_avatar: string;
  seller_reputation: number;
  seller_review_count: number;
  created_at: string;
  sold_at: string | null;
}

interface AuctionData {
  id: number;
  starting_bid: number;
  current_bid: number;
  bidder_id: number | null;
  ends_at: string;
  is_active: number;
  winner_id: number | null;
  bidder_username: string | null;
}

interface BidData {
  id: number;
  bidder_id: number;
  bidder_username: string;
  amount: number;
  created_at: string;
}

export default function ItemDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<ItemData | null>(null);
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [bids, setBids] = useState<BidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const isSimple = user?.is_simple_mode === 1;

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/items/${id}`);
        const data = await res.json();
        setItem(data.item);
        setAuction(data.auction);

        if (data.auction) {
          const bidsRes = await fetch(`/api/auctions/${data.auction.id}/bids`);
          const bidsData = await bidsRes.json();
          setBids(bidsData.bids || []);
        }

        // Load reviews
        const revRes = await fetch(`/api/reviews?seller_id=${data.item.seller_id}`);
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

  async function handleBid(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    setBidError("");
    setBidLoading(true);

    try {
      const res = await fetch("/api/auctions/bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auction_id: auction!.id, amount: parseFloat(bidAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBidError(data.error);
        if (data.minimum_bid) {
          setBidAmount(data.minimum_bid.toFixed(2));
        }
        return;
      }

      // Refresh
      const itemRes = await fetch(`/api/items/${id}`);
      const itemData = await itemRes.json();
      setAuction(itemData.auction);
      const bidsRes = await fetch(`/api/auctions/${itemData.auction.id}/bids`);
      const bidsData = await bidsRes.json();
      setBids(bidsData.bids || []);
      setBidAmount("");
    } catch {
      setBidError("Failed to place bid");
    } finally {
      setBidLoading(false);
    }
  }

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) {
      return digits.slice(0, 2) + "/" + digits.slice(2);
    }
    return digits;
  }

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/auth"); return; }
    setPurchaseError("");
    setPurchaseLoading(true);

    try {
      const res = await fetch(`/api/items/${id}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_number: cardNumber,
          card_name: cardName,
          card_expiry: cardExpiry,
          card_cvv: cardCvv,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPurchaseError(data.error);
        return;
      }

      setTransactionId(data.transaction_id);
      setPurchaseSuccess(true);
      // Reload item to show sold status
      const itemRes = await fetch(`/api/items/${id}`);
      const itemData = await itemRes.json();
      setItem(itemData.item);
    } catch {
      setPurchaseError("Purchase failed. Try again.");
    } finally {
      setPurchaseLoading(false);
    }
  }

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setReviewLoading(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: item!.seller_id,
          item_id: item!.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        setReviewSuccess(true);
        // Reload reviews
        const revRes = await fetch(`/api/reviews?seller_id=${item!.seller_id}`);
        const revData = await revRes.json();
        setReviews(revData.reviews || []);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch {
      alert("Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-tavern-gold text-xl animate-pulse">🔮 Consulting the market oracle...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="tavern-card p-8 text-center">
          <span className="text-5xl">🔍</span>
          <h2 className="font-serif text-xl text-tavern-cream mt-2">Item not found</h2>
          <Link href="/" className="tavern-btn inline-block mt-4">Back to Market</Link>
        </div>
      </div>
    );
  }

  const images = JSON.parse(item.images || "[]");
  const stars = Math.round(item.seller_reputation || 0);

  return (
    <div className={isSimple ? "simple-mode" : ""}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Back button */}
        <button onClick={() => router.back()} className="flex items-center gap-1 text-tavern-cream/50 hover:text-tavern-gold mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Market
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="tavern-card overflow-hidden">
              <div className="aspect-square flex items-center justify-center bg-tavern-dark/50">
                {images.length > 0 ? (
                  <img src={images[currentImage]} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">🎨</span>
                )}
              </div>
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === currentImage ? "border-tavern-gold" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-tavern-cream/40 mb-1">
                <span className="bg-tavern-brown/50 px-2 py-0.5 rounded">{item.category}</span>
                <span>{item.condition}</span>
              </div>
              <h1 className={`font-serif text-tavern-gold ${isSimple ? "text-3xl" : "text-2xl md:text-3xl"}`}>
                {item.title}
              </h1>
            </div>

            {/* Seller info */}
            <Link href={`/shop/${item.seller_id}`} className="flex items-center gap-3 bg-tavern-brown/20 p-3 rounded-lg hover:bg-tavern-brown/30 transition-colors">
              <div className="w-10 h-10 rounded-full bg-tavern-gold/20 flex items-center justify-center">
                <User size={20} className="text-tavern-gold" />
              </div>
              <div>
                <p className="text-tavern-cream font-medium">{item.seller_username}</p>
                <div className="flex items-center gap-2 text-xs text-tavern-cream/50">
                  <ReviewStars rating={stars} size="sm" />
                  <span>({item.seller_review_count || 0} reviews)</span>
                </div>
              </div>
            </Link>

            <div className="tavern-divider" />

            {/* Price / Auction */}
            {item.is_auction && auction ? (
              <div className="tavern-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-tavern-cream/60 text-sm">🏷️ Starting Bid</span>
                  <span className="text-tavern-cream/60">${auction.starting_bid.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-tavern-cream font-serif">💰 Current Bid</span>
                  <span className="text-2xl font-bold text-tavern-gold">${auction.current_bid.toFixed(2)}</span>
                </div>
                {auction.is_active ? (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-tavern-cream/50">
                      <AuctionTimer endsAt={auction.ends_at} />
                    </span>
                    <span className="text-tavern-cream/40">{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
                  </div>
                ) : auction.winner_id ? (
                  <div className="bg-tavern-gold/10 text-tavern-gold p-2 rounded text-center text-sm">
                    🏆 Won by {auction.bidder_username || "someone"}
                  </div>
                ) : (
                  <div className="bg-tavern-red/10 text-tavern-red p-2 rounded text-center text-sm">
                    Auction ended — no bids
                  </div>
                )}

                {/* Bid form */}
                {auction.is_active && user && user.id !== item.seller_id && (
                  <form onSubmit={handleBid} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="tavern-input flex-1"
                        placeholder={`Min $${(auction.current_bid + 0.5).toFixed(2)}`}
                        required
                      />
                      <button type="submit" disabled={bidLoading} className="tavern-btn">
                        {bidLoading ? "..." : <><Gavel size={16} /> Bid</>}
                      </button>
                    </div>
                    {bidError && <p className="text-tavern-red text-sm">⚠️ {bidError}</p>}
                  </form>
                )}

                {/* Bid history */}
                {bids.length > 0 && (
                  <div>
                    <p className="text-sm text-tavern-cream/50 mb-2 font-serif">Bid History</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {bids.map((bid) => (
                        <div key={bid.id} className="flex justify-between text-sm text-tavern-cream/60">
                          <span>{bid.bidder_username}</span>
                          <span className="text-tavern-gold">${bid.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!user && auction.is_active && (
                  <button onClick={() => router.push("/auth")} className="tavern-btn w-full text-sm">
                    Sign in to bid
                  </button>
                )}
              </div>
            ) : item.sold_at ? (
              <div className="bg-tavern-red/10 text-tavern-red p-4 rounded-lg text-center">
                ⛔ This item has been sold
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-tavern-cream/60 text-sm">Price</span>
                  <span className="text-3xl font-bold text-tavern-gold">${item.price.toFixed(2)}</span>
                </div>
                {user && user.id !== item.seller_id ? (
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="tavern-btn w-full flex items-center justify-center gap-2 text-lg py-3"
                  >
                    <ShoppingCart size={20} /> Buy Now
                  </button>
                ) : user && user.id === item.seller_id ? (
                  <p className="text-tavern-cream/40 text-sm text-center italic">
                    This is your listing
                  </p>
                ) : (
                  <button
                    onClick={() => router.push("/auth")}
                    className="tavern-btn w-full flex items-center justify-center gap-2"
                  >
                    <ShoppingCart size={18} /> Sign in to Buy
                  </button>
                )}
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="font-serif text-tavern-cream/70 text-sm mb-2">📜 Description</h3>
                <p className="text-tavern-cream/60 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="tavern-card w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => { setShowCheckout(false); setPurchaseError(""); }}
                className="absolute top-4 right-4 text-tavern-cream/40 hover:text-tavern-cream"
              >
                <X size={20} />
              </button>

              {purchaseSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="text-6xl">✅</div>
                  <h3 className="font-serif text-2xl text-tavern-gold">Purchase Complete!</h3>
                  <p className="text-tavern-cream/60">You bought <strong className="text-tavern-cream">{item.title}</strong></p>
                  <div className="bg-tavern-brown/20 rounded-lg p-3 text-sm">
                    <p className="text-tavern-cream/40">Transaction ID</p>
                    <p className="text-tavern-gold font-mono text-xs break-all">{transactionId}</p>
                  </div>
                  <p className="text-tavern-cream/50 text-sm">The seller will contact you about delivery.</p>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="tavern-btn"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <CreditCard size={32} className="text-tavern-gold mx-auto" />
                    <h3 className="font-serif text-xl text-tavern-gold mt-2">Checkout</h3>
                    <p className="text-tavern-cream/50 text-sm">{item.title}</p>
                    <p className="text-2xl font-bold text-tavern-gold mt-1">${item.price.toFixed(2)}</p>
                  </div>

                  <form onSubmit={handleBuy} className="space-y-4">
                    <div>
                      <label className="block text-sm text-tavern-cream/70 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="tavern-input w-full"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-tavern-cream/70 mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        className="tavern-input w-full font-mono"
                        placeholder="4242 4242 4242 4242"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-tavern-cream/70 mb-1">Expiry</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          className="tavern-input w-full"
                          placeholder="MM/YY"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-tavern-cream/70 mb-1">CVV</label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="tavern-input w-full"
                          placeholder="123"
                          required
                        />
                      </div>
                    </div>

                    {/* Card brand hints */}
                    <div className="flex justify-center gap-3 text-2xl opacity-40">
                      <span>💳</span>
                      <span>🏦</span>
                      <span>🪙</span>
                    </div>

                    {purchaseError && (
                      <div className="bg-tavern-red/10 border border-tavern-red/30 rounded-lg p-3 text-sm text-tavern-red">
                        ⚠️ {purchaseError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={purchaseLoading}
                      className="tavern-btn w-full flex items-center justify-center gap-2 py-3"
                    >
                      {purchaseLoading ? (
                        "⏳ Processing payment..."
                      ) : (
                        <><ShoppingCart size={18} /> Pay ${item.price.toFixed(2)}</>
                      )}
                    </button>

                    <p className="text-xs text-tavern-cream/30 text-center">
                      🔒 This is a simulated payment. No real money is charged.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Reviews section */}
        <div className="mt-12">
          <div className="tavern-divider" />
          <h2 className="font-serif text-xl text-tavern-gold mb-6">📝 Reviews for {item.seller_username}</h2>

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="tavern-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-tavern-cream font-medium">{review.reviewer_username}</span>
                      <ReviewStars rating={review.rating} size="sm" />
                    </div>
                    <span className="text-xs text-tavern-cream/30">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.comment && <p className="text-tavern-cream/60 text-sm">{review.comment}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-tavern-cream/30 text-sm">No reviews yet.</p>
          )}

          {/* Leave a review */}
          {user && user.id !== item.seller_id && item.sold_at && !reviewSuccess && (
            <form onSubmit={handleReview} className="tavern-card p-4 mt-6 space-y-3">
              <h3 className="font-serif text-tavern-cream">Leave a Review</h3>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)} className="text-2xl transition-colors">
                    <span className={star <= reviewRating ? "text-tavern-gold" : "text-tavern-cream/20"}>★</span>
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="tavern-input w-full h-20 resize-none"
                placeholder="Share your experience..."
              />
              <button type="submit" disabled={reviewLoading} className="tavern-btn text-sm">
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}

          {reviewSuccess && (
            <div className="bg-tavern-green/20 text-tavern-green p-3 rounded-lg text-center mt-4">
              ✅ Review submitted! Thank you.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
