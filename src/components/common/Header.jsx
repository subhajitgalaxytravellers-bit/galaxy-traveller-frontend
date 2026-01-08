"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react"; // Import Menu icon
import { useState } from "react"; // Import state hook for managing drawer state
import Link from "next/link";
import Image from "next/image";

const CustomHeader = () => {
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Function to toggle drawer open/close
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  return (
    <header className="flex justify-between items-center px-6 py-4 bg-white shadow-lg">
      {/* Left: Logo */}
      <div className="flex items-center">
        <Image
          src="/path-to-your-logo.png"
          alt="Logo"
          width={48}
          height={48}
          className="w-12 h-12 object-contain"
        />
      </div>

      {/* Right: Menu Icon (for mobile) */}
      <div className="lg:hidden cursor-pointer" onClick={toggleDrawer}>
        <Menu size={24} />
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex space-x-8 text-lg font-medium">
        {["Home", "Destinations", "Experiences", "Blogs", "About"].map(
          (item, index) => (
            <motion.div
              key={index}
              className="relative cursor-pointer text-gray-700 group transition-all duration-300"
            >
              <Link
                href={`/${
                  item.toLowerCase() === "home" ? "" : item.toLowerCase()
                }`}
                className="relative z-10 inline-block"
              >
                <motion.span
                  className="relative"
                  whileHover={{
                    scale: 1.05,
                    textShadow: "0px 0px 6px rgba(0, 0, 0, 0.3)",
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                >
                  {item}
                </motion.span>
              </Link>
              <motion.div
                className="absolute bottom-0 left-0 w-full h-1 bg-primary origin-center scale-x-0 group-hover:scale-x-100 transition-all duration-500"
                style={{
                  transformOrigin: "center",
                }}
              />
            </motion.div>
          )
        )}
      </nav>

      <motion.div
        whileHover={{ scale: 1.1 }}
        className="cursor-pointer max-lg:hidden"
      >
        <Button
          asChild
          variant="outline"
          className="rounded-full text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300"
        >
          <Link to="/contact">Contact Us</Link>
        </Button>
      </motion.div>

      {/* Custom Drawer that comes from the right */}
      <div
        className={`fixed top-0 right-0 w-64 h-full bg-white shadow-lg transform transition-all duration-300 z-50 ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Content */}
        <div className="flex flex-col space-y-6 py-8 px-6">
          {/* Navigation Links */}
          {["Home", "Destinations", "Experiences", "Blog", "About"].map(
            (item, index) => (
              <Link
                key={index}
                to={`/${item.toLowerCase()}`}
                className="text-lg font-medium text-gray-700 hover:text-primary"
                onClick={toggleDrawer} // Close the drawer when a link is clicked
              >
                {item}
              </Link>
            )
          )}
          {/* Contact Us Button */}
          <Button
            asChild
            variant="outline"
            className="w-full text-primary border-primary hover:bg-primary hover:text-white transition-all duration-300"
          >
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>

        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDrawer}
            className="text-primary"
          >
            X
          </Button>
        </div>
      </div>
    </header>
  );
};

export default CustomHeader;
