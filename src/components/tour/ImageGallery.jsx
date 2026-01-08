"use client";
import { useState, useMemo, useCallback } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import Image from "next/image";

const FALLBACK =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop";

export default function ImageGallery({ images = [] }) {
  const safeImages = useMemo(
    () =>
      Array.isArray(images) && images.length
        ? images.filter(Boolean)
        : [FALLBACK],
    [images]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openModal = useCallback((index) => {
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => setIsOpen(false), []);

  const nextImage = useCallback(
    () => setCurrentIndex((i) => (i + 1) % safeImages.length),
    [safeImages.length]
  );
  const prevImage = useCallback(
    () =>
      setCurrentIndex((i) => (i - 1 + safeImages.length) % safeImages.length),
    [safeImages.length]
  );

  const mainImage = safeImages[0];
  const sideImages = safeImages.slice(1, 4); // up to 3
  const sideRows = Math.max(1, sideImages.length);

  return (
    <>
      {/* Mobile */}
      <div className="grid gap-2 sm:gap-3 mb-6">
        <div className="block sm:hidden">
          <div
            className="group cursor-pointer relative overflow-hidden rounded-2xl h-[250px]"
            onClick={() => openModal(0)}
            data-testid="image-main"
          >
            <Image
              src={mainImage}
              alt="Main tour image"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Button
              size="icon"
              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </div>

          {sideImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {sideImages.map((img, index) => (
                <div
                  key={index + 1}
                  className="group cursor-pointer relative overflow-hidden rounded-lg h-[80px]"
                  onClick={() => openModal(index + 1)}
                  data-testid={`image-thumbnail-${index + 1}`}
                >
                  <Image
                    src={img}
                    alt={`Tour image ${index + 2}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="33vw"
                  />
                  {index === 2 && safeImages.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-medium text-xs sm:text-base">
                        View all images
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop */}
        <div className="hidden sm:grid grid-cols-12 gap-3 h-[400px] md:h-[500px]">
          {/* Left: main image */}
          <div
            className="col-span-7 h-full group cursor-pointer relative overflow-hidden rounded-2xl"
            onClick={() => openModal(0)}
            data-testid="image-main"
          >
            <Image
              src={mainImage}
              alt="Main tour image"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 60vw"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Button
              size="icon"
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: nested grid with equal rows (more robust on Windows) */}
          <div
            className="col-span-5 grid gap-3 h-full overflow-hidden"
            style={{
              gridTemplateRows: `repeat(${Math.min(
                3,
                sideRows
              )}, minmax(0, 1fr))`,
            }}
          >
            {sideImages.map((img, index) => (
              <div
                key={index + 1}
                className="group cursor-pointer relative overflow-hidden rounded-xl"
                onClick={() => openModal(index + 1)}
                data-testid={`image-thumbnail-${index + 1}`}
              >
                <Image
                  src={img}
                  alt={`Tour image ${index + 2}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 33vw, 20vw"
                />

                {index === 2 && safeImages.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-medium text-sm sm:text-base">
                      View all images
                    </span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Button
                  size="icon"
                  className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-900 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <Expand className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Expand className="h-4 w-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className=" fixed z-[9999] p-0 bg-black border-0 w-screen h-[100dvh] max-w-none sm:max-w-none rounded-none transform-none overflow-hidden  ">
          <DialogTitle className="sr-only">View full image</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button (uses DialogClose) */}
            <DialogClose asChild>
              <Button
                variant="ghost"
                type="button"
                size="icon"
                className="absolute top-6 left-6 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all duration-200"
                aria-label="Close"
                data-testid="button-close-modal"
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>

            {safeImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all duration-200"
                  onClick={prevImage}
                  data-testid="button-prev-image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all duration-200"
                  onClick={nextImage}
                  data-testid="button-next-image"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {safeImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full">
                {currentIndex + 1} / {safeImages.length}
              </div>
            )}

            {isOpen && (
              <Image
                src={safeImages[currentIndex]}
                alt={`Tour image ${currentIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                data-testid="image-modal"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
