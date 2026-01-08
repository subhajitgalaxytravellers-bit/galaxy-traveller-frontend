import Image from "next/image";
import { Card, CardContent } from "../ui/card";
import { Star, MapPin } from "lucide-react";

export default function TourStays({ stays }) {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6 mb-6">
      <h2 className="text-2xl font-bold mb-6">Where You'll Stay</h2>

      <div className="space-y-6">
        {stays.map((stay, index) => (
          <Card
            key={index}
            className="border border-card-border border-gray-100 p-0 my-3"
          >
            <CardContent className="p-6">
              <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Images */}
                <div className="lg:col-span-1">
                  {stay.images.length > 0 && (
                    <div className="space-y-2">
                      <div className="p-1.5">
                        <Image
                          src={stay.images[0]}
                          alt={stay.hotelName}
                          width={400}
                          height={192}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                      {stay.images.length > 1 && (
                        <div className="grid grid-cols-2 gap-2 p-1.5">
                          {stay.images.slice(1, 3).map((image, imgIndex) => (
                            <Image
                              key={imgIndex}
                              src={image}
                              alt={`${stay.hotelName} ${imgIndex + 2}`}
                              width={150}
                              height={80}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hotel Info */}
                <div className="lg:col-span-2">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <h3
                        className="text-xl font-semibold mb-2"
                        data-testid={`hotel-name-${index}`}
                      >
                        {stay.hotelName}
                      </h3>

                      {/* Description */}
                      <p
                        className="text-muted-foreground leading-relaxed mb-4"
                        data-testid={`hotel-description-${index}`}
                      >
                        {stay.description}
                      </p>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mt-auto">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span data-testid={`hotel-address-${index}`}>
                        {stay.address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
