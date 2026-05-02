import React from "react";
import { motion } from "framer-motion";

// ExperienceCard component to display individual experience
const ExperienceCard = ({ id, name, description, tag, img }) => {
  return (
    <motion.div
      key={id}
      className="relative rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all duration-300"
    >
      <div
        className="w-full h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${img})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      </div>
      <div className="absolute bottom-0 p-4 w-full rounded-b-lg  bg-opacity-0 backdrop-blur-md">
        <h3 className="text-white text-lg font-medium mb-2">{name}</h3>
        <p className="text-white text-sm text-opacity-80 line-clamp-2">
          {description}
        </p>
        <div className="text-teal-500 text-sm font-semibold mt-2">{tag}</div>
      </div>
    </motion.div>
  );
};

export default ExperienceCard;
