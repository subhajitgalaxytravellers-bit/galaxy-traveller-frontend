"use client";
import Image from "next/image";
import { Card, CardContent } from "../ui/card";

function looksLikeGenericHighlightTitle(value) {
  const title = String(value || "").trim();
  return (
    /^experience\s*\d*$/i.test(title) ||
    /^tour\s*highlight\s*\d*$/i.test(title) ||
    /^highlight\s*\d*$/i.test(title)
  );
}

function deriveHighlightTitleFromBrief(brief, fallback = "Tour Highlight") {
  const clean = String(brief || "")
    .trim()
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ");

  if (!clean) return fallback;
  const firstSentence = clean.split(/[.!?]/)[0].trim();
  const source = firstSentence || clean;
  const title = source.split(" ").filter(Boolean).slice(0, 6).join(" ");
  if (title.length < 4) return fallback;
  return title;
}

export default function TourHighlights({ highlights }) {
  const displayHighlights = (highlights || []).map((highlight) => {
    const rawTitle = String(highlight?.title || "").trim();
    const rawBrief = String(highlight?.brief || "").trim();
    const title =
      rawTitle && !looksLikeGenericHighlightTitle(rawTitle)
        ? rawTitle
        : deriveHighlightTitleFromBrief(rawBrief);
    return {
      ...highlight,
      title,
      brief: rawBrief,
    };
  });

  return (
    <div className="space-y-6 mb-6">
      <h2 className="font-heading text-2xl font-bold mb-6 tracking-tight">Tour Highlights</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayHighlights.map((highlight, index) => (
          <Card
            key={index}
            className="border border-card-border border-gray-100 p-0 hover-elevate"
          >
            <CardContent className="p-6">
              <div className="flex gap-4">
                {highlight.img && (
                  <div className="flex-shrink-0 my-auto">
                    <Image
                      src={highlight.img}
                      alt={highlight.title}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3
                    className="font-heading text-lg font-semibold mb-2 tracking-tight"
                    data-testid={`highlight-title-${index}`}
                  >
                    {highlight.title}
                  </h3>
                  <p
                    className="text-muted-foreground text-sm leading-relaxed"
                    data-testid={`highlight-brief-${index}`}
                  >
                    {highlight.brief}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
