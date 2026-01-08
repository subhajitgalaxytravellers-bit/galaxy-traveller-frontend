"use client";
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Star } from "lucide-react";

import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import Image from "next/image";

export default function TourReviews({ reviews, overallRating, totalReviews }) {
  const [visibleCount, setVisibleCount] = useState(3);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? "fill-orange-500 text-orange-500" : "text-gray-300"
        }`}
      />
    ));
  };

  const visibleReviews = useMemo(
    () => reviews.slice(0, Math.min(visibleCount, reviews.length)),
    [reviews, visibleCount]
  );

  const canShowMore = visibleCount < reviews.length;
  const canShowLess = reviews.length > 3 && !canShowMore;

  return (
    <div className="space-y-6 ">
      <div className="flex items-center justify-between  ">
        <h2 className="text-2xl font-semibold w-full  lg:mt-6">
          Customer Reviews
        </h2>
        <div className="flex lg:justify-end items-center max-md:items-end max-md:flex-col max-md:gap-0 gap-2 w-full">
          <div className="flex items-center gap-1">
            <div className="flex">{renderStars(Math.floor(overallRating))}</div>
            <span
              className="font-semibold text-lg"
              data-testid="text-overall-rating"
            >
              {overallRating}
            </span>
          </div>
          <span className="text-muted-foreground  ">
            ({totalReviews} reviews)
          </span>
        </div>
      </div>

      <div className="space-y-6 flex flex-col gap-4">
        {visibleReviews.map((review, idx) => (
          <Card key={idx} className="p-0 border border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={review.profileImg} alt={review.name} />
                  <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4
                        className="font-semibold"
                        data-testid={`reviewer-name-${review.id}`}
                      >
                        {review.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {review.date}
                      </p>
                    </div>
                    <div className="flex">{renderStars(review.stars)}</div>
                  </div>

                  <div>
                    <h5
                      className="font-medium mb-2"
                      data-testid={`review-title-${review.id}`}
                    >
                      {review.heading}
                    </h5>
                    <p
                      className="text-muted-foreground leading-relaxed"
                      data-testid={`review-content-${review.id}`}
                    >
                      {review.review}
                    </p>
                  </div>

                  {review?.img?.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      {review.img.map((photo, index) => (
                        <Image
                          key={index}
                          src={photo}
                          alt={`Review photo ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-cover rounded-md hover-elevate cursor-pointer"
                          data-testid={`review-photo-${review.id}-${index}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Show more / Show less controls */}
        {canShowMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              className="px-5 py-2 border border-gray-200 text-primary  hover:text-primary "
              onClick={() =>
                setVisibleCount((c) => Math.min(c + 8, reviews.length))
              }
              data-testid="button-show-more-reviews"
            >
              Show more
            </Button>
          </div>
        )}

        {canShowLess && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              className="px-5 py-2 border border-gray-200 text-primary  hover:text-primary "
              onClick={() => setVisibleCount(3)}
              data-testid="button-show-less-reviews"
            >
              Show less
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
