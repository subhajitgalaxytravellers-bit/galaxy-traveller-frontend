"use client";
import React from "react";
import { motion } from "framer-motion";

const items = [
  {
    title: "Cruises",
    subtitle: "Relaxing sea voyages",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=80",
  },
  {
    title: "Hiking",
    subtitle: "Trek through nature",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&q=80",
  },
  {
    title: "Airbirds",
    subtitle: "Aerial adventures",
    image:
      "https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=1000&q=80",
  },
  {
    title: "Wildlife",
    subtitle: "Observe wild animals",
    image:
      "https://images.unsplash.com/photo-1543877087-ebf71fde2be1?w=1000&q=80",
  },
  {
    title: "Walking",
    subtitle: "Peaceful strolls",
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&q=80",
  },
  {
    title: "Adventure",
    subtitle: "Thrilling experiences",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1000&q=80",
  },
];

const CategoryCarousel = () => {
  const duplicatedItems = [...items, ...items, ...items, ...items]; // Duplicate 4 times for smooth looping

  return (
    <div className="w-full overflow-x-hidden overflow-y-visible">
      <motion.div
        className="flex overflow-visible min-h-[20rem]"
        animate={{ x: [-272 * items.length, 0] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {duplicatedItems.map((item, i) => (
          <div
            key={i}
            className="flex-shrink-0 my-auto w-64 h-64 mx-2 relative rounded-lg overflow-hidden cursor-pointer
                     hover:scale-105 transition-transform duration-300"
            style={{
              backgroundImage: `url(${item.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <p className="text-sm opacity-80">{item.subtitle}</p>
              <h3 className="font-bold text-lg">{item.title}</h3>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default CategoryCarousel;
