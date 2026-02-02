"use client";

import { Users, MapPin, Globe, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsSection({ stats }) {
  const statItems = [
    { value: stats.happyTravelers, label: 'Happy Travelers', icon: Users },
    { value: stats.countries, label: 'Countries', icon: MapPin },
    { value: stats.tourPackages, label: 'Tour Packages', icon: Globe },
    { value: stats.yearsExperience, label: 'Years Experience', icon: Award },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center justify-center p-6 bg-card border rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
              >
                <div className="mb-4 p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-4xl md:text-5xl font-extrabold text-primary mb-2 tracking-tight">
                  {item.value}
                </h3>
                <p className="text-muted-foreground font-medium text-lg text-center">
                  {item.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
