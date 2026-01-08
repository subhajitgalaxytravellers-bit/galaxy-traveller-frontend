"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import Image from "next/image";

export default function ReviewCard({ img, review, user, location, rating }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full w-full max-w-md mx-auto"
    >
      <Card className="relative w-full overflow-hidden rounded-2xl shadow-lg border-none aspect-[3/4] sm:aspect-[4/5]">
        {/* Background image */}
        <Image
          src={img}
          alt={user}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 400px"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 w-full p-4 sm:p-6 text-white">
          {/* Review text */}
          <p className="text-sm sm:text-base text-gray-200 line-clamp-3 mb-3 italic">
            “{review}”
          </p>

          {/* Rating stars */}
          <div className="flex justify-center items-center mb-2 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400"
                }
              />
            ))}
          </div>

          {/* User info */}
          <div className="text-center sm:text-left">
            <h4 className="font-semibold text-base sm:text-lg truncate">{user}</h4>
            <p className="text-xs sm:text-sm text-gray-300 truncate">{location}</p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
