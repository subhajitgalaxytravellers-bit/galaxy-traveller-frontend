"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1, // Reduced from 0.15 for smoother performance
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }, // Reduced from 0.6
  },
};

export default function FeaturedTours({ tours }) {
  const router = useRouter();

  return (
    <section id="tours" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-semibold mb-2 uppercase tracking-wider">
            Featured Tours
          </p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Popular Tour Packages
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Carefully curated experiences designed to give you the adventure of
            a lifetime
          </p>
        </motion.div>

        {/* Tours Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {tours?.map((tour, idx) => (
            <motion.div key={tour.id || idx} variants={cardVariants}>
              <Card className="group p-0 overflow-hidden border-0 card-shadow hover:hover-shadow transition-all duration-300">
                <CardContent className="p-0">
                  {/* Image */}
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <Image
                      src={tour.heroImg || "/assets/default-tour.jpg"}
                      alt={tour.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    <Badge className="absolute top-4 right-4 bg-secondary text-primary-foreground">
                      {tour.badge || tour.tourType}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{tour.location || tour.place}</span>

                      <div className="flex items-center gap-1 ml-auto">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-foreground">
                          {tour.rating}
                        </span>
                        <span>({tour.reviews})</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold mb-4 group-hover:text-primary transition-colors">
                      {tour.title}
                    </h3>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{tour.duration || tour.details?.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span>
                          {tour.groupSize || tour.details?.groupSize} People
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">From</p>
                        <p className="text-2xl font-bold text-primary">
                          Rs.{tour.price || tour.details?.pricePerPerson}
                        </p>
                      </div>

                      <Button
                        onClick={() => router.push(`/tours/${tour.slug}`)}
                        variant="default"
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button
            onClick={() => router.push("/tours")}
            variant="outline"
            size="lg"
            className="px-8"
          >
            View All Tours
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
