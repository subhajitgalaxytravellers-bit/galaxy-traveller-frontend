"use client";
import { useMemo, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp, Clock, Info } from "lucide-react";
import Image from "next/image";

export default function TourItinerary({ itinerary }) {
  const normalizedItinerary = useMemo(() => {
    if (!Array.isArray(itinerary)) return [];
    return itinerary.map((day, idx) => {
      const blocks =
        Array.isArray(day?.blocks) && day.blocks.length > 0
          ? day.blocks
          : [
              {
                title: day?.title || `Day ${idx + 1} Plan`,
                activity:
                  day?.activity || "",
                notes: day?.notes || "",
                time: day?.time || "",
                image: day?.image || "",
              },
            ];

      return {
        day: day?.day || String(idx + 1),
        title: day?.title || blocks?.[0]?.title || `Day ${idx + 1}`,
        blocks,
      };
    });
  }, [itinerary]);

  const [expandedDays, setExpandedDays] = useState(
    () => new Set(normalizedItinerary?.[0]?.day ? [normalizedItinerary[0].day] : [])
  );

  const toggleDay = (day) => {
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 mb-6">
      <h2 className="text-lg lg:text-xl font-semibold text-slate-800 mb-6">Detailed Itinerary</h2>

      <div className="space-y-4">
        {normalizedItinerary.map((day, idx) => {
          const isExpanded = expandedDays.has(day.day);
          
          return (
          <Card
            key={idx}
            className={`p-0 border shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-2xl overflow-hidden transition-all duration-200 ${
              isExpanded ? "border-slate-300 ring-4 ring-slate-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div
              className={`p-5 lg:px-8 lg:py-6 cursor-pointer flex justify-between items-center transition-colors hover:bg-slate-50/50`}
              onClick={() => toggleDay(day.day)}
              data-testid={`day-header-${day.day}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-slate-200/60 text-[#1e293b] rounded-xl flex items-center justify-center text-base lg:text-lg font-bold flex-shrink-0">
                  {day.day}
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-medium text-slate-800 tracking-tight">
                    Day {idx + 1}
                  </h3>
                  <p className="text-[13px] lg:text-[13px] text-slate-500 mt-0.5 font-medium select-none">
                    {day.blocks?.length || 0} activities
                  </p>
                </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-10 w-10 shrink-0 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-transform duration-300 ${isExpanded ? "bg-slate-100" : ""}`}
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </div>

          {isExpanded && (
            <CardContent
                className="pt-0 pb-6 px-5 lg:px-8 border-t-0"
              >
                <div className="space-y-4 pt-2">
                  {day.blocks.map((block, index) => {
                    const cleanTitle = block.title?.replace(/^[-→\s]+/, '') || "";
                    const cleanActivity = block.activity?.replace(/^[-→\s]+/, '') || "";
                    
                    return (
                    <div
                      key={index}
                      className="flex gap-4 p-4 lg:p-5 bg-slate-50/50 border border-slate-200 rounded-xl"
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 bg-slate-200/60 rounded-xl shadow-sm border border-slate-200/50">
                          <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-slate-700" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 mt-0">
                        {cleanTitle && (
                          <h4 className="text-[15px] lg:text-[16px] font-medium text-slate-800 mb-1">
                            {cleanTitle}
                          </h4>
                        )}
                        {cleanActivity && (
                          <p className="text-[12px] lg:text-[13px] text-slate-600 leading-relaxed font-normal">
                            {cleanActivity}
                          </p>
                        )}
                        {/* Time & Notes */}
                        {(block.time || block.notes) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[13px] lg:text-sm">
                            {block.time && (
                              <span className="inline-flex items-center text-slate-700 bg-slate-200/50 px-2.5 py-1 rounded font-semibold border border-slate-200">
                                {block.time}
                              </span>
                            )}
                            {block.notes && (
                              <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2.5 py-1 rounded font-medium border border-amber-100">
                                {block.notes}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Image */}
                      {block.image && (
                        <div className="flex-shrink-0 ml-2 hidden sm:block">
                          <Image
                            src={block.image}
                            alt={cleanTitle || "Activity image"}
                            width={160}
                            height={120}
                            className="w-32 h-24 lg:w-40 lg:h-28 object-cover rounded-xl border border-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              </CardContent>
            )}
          </Card>
        )})}
      </div>
    </div>
  );
}
