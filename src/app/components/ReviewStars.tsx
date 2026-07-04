"use client";

interface ReviewStarsProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

export default function ReviewStars({ rating, size = "md" }: ReviewStarsProps) {
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <span className={`${sizeClass} text-tavern-gold`}>
      {"★".repeat(Math.floor(rating))}
      {"☆".repeat(5 - Math.floor(rating))}
    </span>
  );
}
