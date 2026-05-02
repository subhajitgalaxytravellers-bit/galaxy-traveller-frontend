import React from "react";
import useEmblaCarousel from "embla-carousel-react";

export default function CardCarousel({ items, renderCard }) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
    skipSnaps: false,
    dragFree: true, // ✅ smoother mobile swiping
  });

  return (
    <div className="relative w-full touch-pan-y">
      {/* Viewport */}
      <div
        className="overflow-hidden px-2 sm:px-4"
        ref={emblaRef}
        style={{
          paddingBottom: "1rem",
          minHeight: "360px",
        }}
      >
        {/* Track */}
        <div className="flex gap-3 sm:gap-4 md:gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex-[0_0_85%] sm:flex-[0_0_45%] md:flex-[0_0_30%] lg:flex-[0_0_22%]"
            >
              {renderCard(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
