'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import SafeImage from '@/components/common/SafeImage';
import {
  Globe,
  Map,
  Heart,
  Users,
  Sunset,
  Mountain,
  Sparkles,
  Compass,
} from 'lucide-react';

// Icon fallback map — matches the `icon` field stored on the category
const ICON_MAP = {
  globe: Globe,
  map: Map,
  heart: Heart,
  users: Users,
  sunset: Sunset,
  mountain: Mountain,
  sparkles: Sparkles,
  compass: Compass,
};

function CategoryIcon({ name, className }) {
  const Icon = ICON_MAP[name?.toLowerCase()] || Compass;
  return <Icon className={className} />;
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
};

export default function TourCategories({ groups = [] }) {
  if (!groups || groups.length === 0) return null;

  return (
    <section id="tour-categories" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-center mb-14"
        >
          <p className="text-primary font-semibold mb-2 uppercase tracking-wider text-sm">
            Explore By Category
          </p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-4 italic tracking-wide">
            Find Your Perfect Trip
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Browse our curated packages by travel style — from romantic getaways
            to grand international adventures
          </p>
        </motion.div>

        {/* Category grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {groups.map((group) => (
            <motion.div key={group.tag || group.id} variants={cardVariants}>
              <Link
                href={`/tours/${group.tag}`}
                className="group relative flex flex-col items-center justify-end overflow-hidden rounded-2xl aspect-[4/5] bg-muted hover:shadow-xl transition-shadow duration-300"
              >
                {/* Background image */}
                {group.coverImg ? (
                  <SafeImage
                    src={group.coverImg}
                    alt={group.name || group.tag}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110 z-0"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/60 z-0" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" />

                {/* Content */}
                <div className="relative z-20 w-full p-4 text-white text-center">
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:bg-primary/80 transition-colors duration-300">
                      <CategoryIcon name={group.icon} className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-base md:text-lg leading-tight">
                    {group.name || group.tag}
                  </h3>
                  {group.regions && group.regions.length > 0 && (
                    <p className="text-xs text-white/70 mt-1 hidden sm:block">
                      {group.regions.slice(0, 3).map(r => r.name || r.tag).join(' · ')}
                      {group.regions.length > 3 && ' · …'}
                    </p>
                  )}
                </div>

                {/* Hover ring */}
                <span className="absolute inset-0 border-2 border-transparent group-hover:border-primary/60 rounded-2xl z-20 transition-all duration-300" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
