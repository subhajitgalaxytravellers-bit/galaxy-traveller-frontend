"use client";
import { useMemo } from "react";
import { Card, CardContent } from "../ui/card";

function extractEmbedSrc(input) {
  if (!input) return "";
  const trimmed = String(input).trim();

  // If they already passed a URL, use it
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Otherwise try to pull src="..." out of an <iframe> snippet
  const m = trimmed.match(/src=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

export default function TourMap({ mapEmbed }) {
  const src = useMemo(() => extractEmbedSrc(mapEmbed), [mapEmbed]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Location &amp; Map</h2>

      <Card className="border border-gray-400 p-0 rounded-lg">
        <CardContent className="p-0">
          {src ? (
            <div className="w-full  overflow-hidden">
              <iframe
                key={src} // re-render if url changes
                src={src} // pass the embed URL directly
                title="Tour location map"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full aspect-video border-0 p-0 rounded-lg"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Map is unavailable.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
