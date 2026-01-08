import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export default function BlogCard({ title, img, description, link }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className=" mx-auto max-w-[20rem]"
    >
      <Card
        className="relative w-full p-0 h-[30rem]  overflow-hidden rounded-2xl shadow-lg border-border/40 
                   hover:shadow-2xl transition-all duration-300 group flex flex-col"
      >
        {/* Image section */}
        <div className="relative h-1/2 w-full overflow-hidden">
          <Image
            src={img}
            alt={title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
            sizes="(max-width: 640px) 100vw, 320px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <CardHeader className="w-full">
          <CardTitle className="text-lg font-semibold line-clamp-2">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-4">
            {description}
          </p>
        </CardContent>

        {/* Footer with animated button */}
        <CardFooter className="ml-auto mt-auto pb-5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300 group"
          >
            <motion.a
              href={link || "#"}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex items-center gap-2"
            >
              Read More{" "}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </motion.a>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
