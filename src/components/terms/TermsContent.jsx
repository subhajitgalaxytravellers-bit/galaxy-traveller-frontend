"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ArrowDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function TermsContent({ sections }) {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative h-[60vh] min-h-[400px]">
        <Image
          src="/assets/polices-bg.jpeg"
          alt="Terms & Conditions"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background" />

        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Terms & Conditions
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-4">
              Please read carefully before using our services
            </p>
            <p className="text-sm text-white/70">Last Updated: {lastUpdated}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-12"
          >
            <span className="text-sm text-white">Scroll</span>
            <ArrowDown className="w-6 h-6 animate-bounce text-white mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Home
          </Link>

          <div className="prose prose-lg max-w-none text-muted-foreground wrap-break-word">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="mb-10"
              >
                <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                  {section.title}
                </h2>

                {section.paragraphs.map((p, i) => (
                  <p key={i} className="leading-relaxed mb-4">
                    {p}
                  </p>
                ))}

                {section.list.length > 0 && (
                  <ul className="space-y-2 ml-6">
                    {section.list.map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className="flex items-start gap-3 text-muted-foreground"
                      >
                        <span className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />

                        {/* WRAP FIX */}
                        <span className="flex-1 break-words whitespace-normal min-w-0">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
