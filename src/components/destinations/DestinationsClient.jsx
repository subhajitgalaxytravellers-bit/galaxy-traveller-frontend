"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Star, Calendar, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import CTA from "@/components/common/CTA";
import Link from "next/link";
import { sanitizeGCSUrl } from "@/lib/sanitizeUrl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";

export default function DestinationsClient({ continents }) {
  const [selectedContinent, setSelectedContinent] = useState(
    continents?.[0]?.title || null
  );

  const activeContinent = continents.find((c) => c.title === selectedContinent);

  const destinations = activeContinent?.destinations || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const formatAvailability = (destination) => {
    const months = destination?.tagMonths || [];
    if (!Array.isArray(months) || months.length === 0) return 'Year-round availability';
    const names = months
      .map((m) => m?.month || m?.monthTag || '')
      .filter(Boolean)
      .map((m) => m.charAt(0).toUpperCase() + m.slice(1));
    return names.length ? names.join(', ') : 'Year-round availability';
  };

  console.log(destinations);
  return (
    <>
      {/* HERO SECTION */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="relative z-20 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Feel the Adventure of a Lifetime
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Explore our destinations and embark on unforgettable journeys
          </p>
        </div>
        <div className="absolute inset-0 hero-bottom-fade z-10"></div>
        <Image
          src="/assets/hero-blog.jpg"
          alt="Destinations Hero"
          fill
          className="object-cover"
          priority
        />
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Mobile/Tablet Dropdown */}
          <div className="lg:hidden">
            <label className="sr-only" htmlFor="continent-select">
              Select continent
            </label>
            <Select
              value={selectedContinent || ''}
              onValueChange={(val) => setSelectedContinent(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select continent" />
              </SelectTrigger>
              <SelectContent>
                {continents.map((continent) => (
                  <SelectItem key={continent.title} value={continent.title}>
                    {continent.title.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
            <nav className="lg:sticky lg:top-24 space-y-2">
              {continents.map((continent) => (
                <button
                  key={continent.title}
                  onClick={() => setSelectedContinent(continent.title)}
                  className={`w-full text-left px-4 py-3 text-lg font-medium transition-all duration-300 border-l-4 hover:bg-muted/50 ${
                    selectedContinent === continent.title
                      ? "border-secondary text-secondary bg-muted/30"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {continent.title.toUpperCase()}
                </button>
              ))}
            </nav>
          </aside>

          {/* DESTINATIONS GRID */}
          <div className="flex-1 ">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedContinent}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {destinations.map((destination, index) => (
                  <motion.div key={index} variants={itemVariants}>
                    <Link href={`/destinations/${destination.slug}`}>
                      <Card className="group p-0 overflow-hidden border-0 card-shadow hover:hover-shadow transition-all duration-300 cursor-pointer h-full">
                        <CardContent className="p-0 relative h-80">
                          <div className="relative overflow-hidden h-full">
                            <Image
                              src={destination.heroImg}
                              alt={destination.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

                            {/* Default Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 text-white transition-all duration-300 group-hover:translate-y-[-20px]">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {destination.tourCount ?? destination.tours?.length ?? 0} Tours
                                </span>
                              </div>

                              <h3 className="text-2xl font-bold mb-2">
                                {destination.title}
                              </h3>

                              <div className="flex items-center gap-1">
                                <span className="font-semibold">
                                  Starting from Rs. {destination.startingPrice?.toLocaleString() || "-"}
                                </span>
                              </div>
                            </div>

                            {/* Hover Details */}
                            <div className="absolute inset-0 bg-primary/95 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform duration-300 p-6 flex flex-col justify-center">
                              <h3 className="text-2xl font-bold text-white mb-4">
                                {destination.title}
                              </h3>

                              <p className="text-white/90 mb-6 text-sm leading-relaxed">
                                {destination.description}
                              </p>

                              <div className="space-y-3">
                                <div className="flex items-center gap-3 text-white">
                                  <MapPin className="w-5 h-5" />
                                  <span className="text-sm font-medium">
                                    {destination.tourCount ?? destination.tours?.length ?? 0} Available
                                    Tours
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-white">
                                  <IndianRupee className="w-5 h-5 text-green-300" />
                                  <span className="text-sm font-medium">
                                    Starting from Rs. {destination.startingPrice?.toLocaleString() || "-"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-white">
                                  <Calendar className="w-5 h-5" />
                                  <span className="text-sm font-medium">
                                    {formatAvailability(destination)}
                                  </span>
                                </div>
                              </div>

                              <button className="mt-6 w-full bg-white text-primary font-semibold py-3 rounded-lg hover:bg-white/90 transition-colors">
                                Explore
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <CTA />
    </>
  );
}
