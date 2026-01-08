"use client";
import Image from "next/image";
import { Card, CardContent } from "../ui/card";

export default function TourMoments({ moments }) {
  return (
    <div className="space-y-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Memorable Moments</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moments.map((moment, index) => (
          <Card
            key={index}
            className="border border-card-border p-0 border-gray-100 hover-elevate group overflow-hidden"
          >
            <CardContent className="p-0">
              <div className="relative">
                <Image
                  src={moment.img}
                  alt={moment.altText}
                  width={400}
                  height={192}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p
                    className="text-white text-sm leading-relaxed"
                    data-testid={`moment-description-${index}`}
                  >
                    {moment.description}
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
