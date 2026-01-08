import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export const FlyerCard = ({ flyer }) => {
  const url =
    flyer.type === "destination"
      ? `/destinations/${flyer.destination.slug || flyer.destination}`
      : `/tours/${flyer.tour.slug || flyer.tour}`;

  return (
    <Link href={url}>
      <div className="group cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={flyer?.image}
            alt={flyer?.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
          />

          {/* STRONGER GRADIENT */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg font-semibold mb-1">{flyer.title}</h3>

            {/* FIXED TEXT WRAP */}
            <p className="text-sm opacity-90 whitespace-normal break-words">
              {flyer.description}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
};
