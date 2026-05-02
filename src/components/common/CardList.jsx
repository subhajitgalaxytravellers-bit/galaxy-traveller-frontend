import React, { useState } from "react";
import { motion } from "framer-motion";

// Generic CardList Component
const CardList = ({ title, cardData, CardComponent }) => {
  const [selectedGroup, setSelectedGroup] = useState(cardData[0]); // Default to the first group

  // Handle group click to update the selected group and its cards
  const handleGroupClick = (group) => {
    setSelectedGroup(group);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen container mx-auto">
      {/* Left Sidebar: Groups */}
      <motion.div
        className="w-full lg:w-1/5 p-6 bg-white shadow-lg max-w-[10rem] lg:block mb-6 lg:mb-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-2xl font-semibold mb-8">{title}</h2>
        <div className="space-y-4 flex md:flex-col">
          {cardData.map((group, index) => (
            <motion.div
              key={index}
              className={`cursor-pointer text-lg p-2 ${
                selectedGroup.title === group.title
                  ? "text-teal-500 font-bold"
                  : "text-gray-700"
              }`}
              whileHover={{ scale: 1.05, x: 10 }}
              onClick={() => handleGroupClick(group)}
            >
              {group.title}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Right Content Area: Display Selected Group Cards */}
      <motion.div
        className="flex-1 bg-gray-100 p-6 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold mb-8">{selectedGroup.title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {selectedGroup.cards.map((card) => (
            <CardComponent
              key={card.id}
              id={card.id}
              name={card.name}
              title={card.title}
              description={card.description}
              tag={card.price}
              img={card.img}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CardList;
