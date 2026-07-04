export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  is_simple_mode: boolean;
  created_at: string;
}

export interface Item {
  id: number;
  seller_id: number;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  is_auction: boolean;
  created_at: string;
  sold_at: string | null;
  seller_username?: string;
  seller_avatar?: string;
  seller_reputation?: number;
}

export interface Auction {
  id: number;
  item_id: number;
  starting_bid: number;
  current_bid: number;
  bidder_id: number | null;
  ends_at: string;
  is_active: boolean;
  winner_id: number | null;
  item?: Item;
}

export interface Bid {
  id: number;
  auction_id: number;
  bidder_id: number;
  bidder_username: string;
  amount: number;
  created_at: string;
}

export interface Review {
  id: number;
  reviewer_id: number;
  seller_id: number;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_username?: string;
}

export interface Session {
  user: User;
  token: string;
}

export const CATEGORIES = [
  "Clothing & Accessories",
  "Electronics",
  "Furniture & Home",
  "Books & Media",
  "Toys & Hobbies",
  "Antiques & Collectibles",
  "Sports & Outdoors",
  "Musical Instruments",
  "Art & Crafts",
  "Other",
];

export const CONDITIONS = [
  "Like New",
  "Excellent",
  "Good",
  "Fair",
  "For Parts / Not Working",
];
