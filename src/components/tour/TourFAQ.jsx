"use client";
import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function TourFAQ({ faqs }) {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleItem = (index) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 mb-6">
      <h2 className="font-heading text-2xl font-bold mb-6 tracking-tight">Frequently Asked Questions</h2>

      <div className="space-y-4 flex flex-col gap-4">
        {faqs.map((faq, index) => (
          <Card
            key={index}
            className="p-0 border border-gray-100 rounded-lg shadow-sm"
          >
            <div
              className="p-4 cursor-pointer hover-elevate flex justify-between  items-center"
              onClick={() => toggleItem(index)}
              data-testid={`faq-question-${index}`}
            >
              <p className="text-[1rem] font-[500] text-left flex-1 pr-4">
                {faq.question}
              </p>
              <Button
                variant="ghost"
                size="icon"
                data-testid={`button-toggle-faq-${index}`}
              >
                {expandedItems.has(index) ? (
                  <ChevronUp className="h-5 w-5 text-orange-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-orange-500" />
                )}
              </Button>
            </div>

            {expandedItems.has(index) && (
              <CardContent
                className="pt-0 pb-4 px-4"
                data-testid={`faq-answer-${index}`}
              >
                <p className="text-md font-medium text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
