"use client";
import Image from "next/image";
import { Card, CardContent } from "../ui/card";

export default function TourHighlights({ highlights }) {
  return (
    <div className="space-y-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Tour Highlights</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {highlights.map((highlight, index) => (
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
                    className="text-lg font-medium mb-2"
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
