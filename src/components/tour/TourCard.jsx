import { MapPin, Clock, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export const TourCard = ({ tour }) => {
  return (
    <Link href={`/tours/${tour.slug}`} className="group block">
      <div className="relative h-[400px] rounded-2xl overflow-hidden border border-border/50 bg-card/70 backdrop-blur-sm transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl">
        {/* Background Image */}
        <Image
          src={tour.heroImg}
          alt={tour.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/12 mix-blend-screen" />

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          {/* Location */}
          <div className="flex items-center gap-1.5 bg-background/70 backdrop-blur-sm border border-white/20 w-fit pr-4 pl-2 py-1 rounded-full text-black text-xs shadow-sm group-hover:bg-white/80 group-hover:text-foreground group-hover:border-transparent">
            <MapPin className="h-3 w-3" />
            <span>{tour.place}</span>
          </div>

          {/* Bottom Content */}
          <div className="space-y-3">
            {/* Title */}
            <h3 className="font-heading text-xl text-white md:text-xl font-semibold drop-shadow group-hover:text-white">
              {tour.title}
            </h3>

            {/* Rating */}
            <div className="font-heading text-xl font-bold text-white md:text-xl">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(tour.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/40"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white text-xs">
                {tour.rating} ({tour.reviews})
              </span>
            </div>

            {/* Duration & Price */}
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <div className="flex items-center gap-1.5 text-white/90">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{tour.details.duration} Days</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/70">From</p>
                <p className="text-xl font-bold text-white">
                  Rs. {tour.details.pricePerPerson.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
