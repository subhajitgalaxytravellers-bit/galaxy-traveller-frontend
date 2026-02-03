"use client";
import { Card, CardContent } from "../ui/card";
import { Check, X } from "lucide-react";

export default function TourInclusions({ included, excluded }) {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      <Card className="border border-card-border p-0 border-gray-100">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            What&apos;s Included
          </h3>
          <ul className="space-y-3">
            {included.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3"
                data-testid={`included-${index}`}
              >
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border border-card-border border-gray-100 p-0">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <X className="h-5 w-5 text-red-500" />
            What&apos;s Not Included
          </h3>
          <ul className="space-y-3">
            {excluded.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-3"
                data-testid={`excluded-${index}`}
              >
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
