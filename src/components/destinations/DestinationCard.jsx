import { MapPin, Star } from "lucide-react";
import Link from "next/link";

import { sanitizeGCSUrl } from "@/lib/sanitizeUrl";
import Image from "next/image";

export const DestinationCard = ({ destination }) => {
  const toursCount = destination?.tours?.length || destination?.tourCount || 0;
  const ratingValue = Number(destination?.rating) || null;

  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className="group block h-full"
    >
      <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-lg">
        <Image
          src={sanitizeGCSUrl(
            destination.heroImg || destination.displayImg || destination.image
          )}
          alt={destination.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 bg-primary w-fit pr-4 pl-2 py-1 rounded-full text-white/90 text-xs">
            <MapPin className="h-3 w-3" />
            <span>
              {destination.place ||
                destination.tagline ||
                destination.title ||
                "Explore"}
            </span>
          </div>

          <div className="space-y-3">
            <h3 className="font-heading text-xl text-white group-hover:text-primary transition-colors md:text-xl font-semibold">
              {destination.title}
            </h3>

            {destination.tagline || destination.description ? (
              <p className="text-sm text-white/80 line-clamp-2">
                {destination.tagline || destination.description}
              </p>
            ) : null}

            {ratingValue ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.round(ratingValue)
                          ? "fill-amber-400 text-amber-400"
                          : "text-white/40"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-white/80">
                  {ratingValue.toFixed(1)} rating
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <div className="flex items-center gap-1.5 text-white/90">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {toursCount > 0 ? `${toursCount} Tours` : "Discover now"}
                </span>
              </div>
              {destination.startingPrice ? (
                <div className="text-right">
                  <p className="text-xs text-white/70">Starting from</p>
                  <p className="text-lg font-bold text-white">
                    Rs. {destination.startingPrice.toLocaleString()}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
