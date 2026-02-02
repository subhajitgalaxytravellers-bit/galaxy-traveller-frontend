"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export const Timeline = ({ data }) => {
  return (
    <section className="bg-background py-10 md:py-24">
      <div className="container mx-auto px-4">
        <h1 className="text-foreground mb-4 text-center text-4xl font-bold tracking-tight sm:text-5xl">
          The Journey of GalaxyTravel
        </h1>
        <p className="text-muted-foreground text-center text-lg max-w-2xl mx-auto mb-16">
          From humble beginnings to global recognition, here&apos;s our story of growth and dedication
        </p>

        <div className="relative mx-auto max-w-3xl">
          {/* Subtle vertical line */}
          <div className="absolute left-8 top-5 bottom-5 w-px bg-border md:left-1/2" />

          {data.map((entry, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative mb-12 pl-20 md:pl-0"
            >
              {/* Timeline dot */}
              <div className="absolute left-[31px] top-5 h-3 w-3 -translate-x-1/2 rounded-full bg-primary ring-4 ring-background md:left-1/2" />

              {/* Content Container */}
              <div className={`flex flex-col md:flex-row ${index % 2 === 0 ? 'md:flex-row-reverse' : ''} gap-8 items-start md:items-center`}>
                 {/* Date/Title Side */}
                 <div className={`flex-1 ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                   <h4 className="text-xl font-semibold  text-foreground">
                      {entry.title}
                    </h4>
                    <p className="mb-2 text-sm text-muted-foreground font-semibold text-primary">{entry.year}</p>
                 </div>

                 {/* Card Side */}
                 <div className="flex-1 w-full">
                    <Card className="border bg-card shadow-sm hover:shadow-md transition hover:scale-105 duration-300">
                      <CardContent className="px-5 py-4">
                        <p className="leading-relaxed text-muted-foreground text-sm md:text-base">
                          {entry.description}
                        </p>
                      </CardContent>
                    </Card>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
