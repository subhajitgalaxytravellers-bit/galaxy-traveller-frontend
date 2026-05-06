"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { sanitizeGCSUrl } from "@/lib/sanitizeUrl";

const DEFAULT_FALLBACK_SRC = "/assets/travel-placeholder.svg";

export default function SafeImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK_SRC,
  seed = "",
  alt = "Image",
  onError,
  ...props
}) {
  const sanitizedSrc = useMemo(() => {
    const value = sanitizeGCSUrl(src, seed || alt || fallbackSrc);
    return value || fallbackSrc;
  }, [alt, fallbackSrc, seed, src]);

  const [currentSrc, setCurrentSrc] = useState(sanitizedSrc);

  useEffect(() => {
    setCurrentSrc(sanitizedSrc);
  }, [sanitizedSrc]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
}
