import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// DestinationCard component to display individual destination
export const MapDestinationCard = ({ id, name, tag, img }) => {
  return (
    <Link href={`/destination/${id}`} className='relative block'>
      <motion.div
        key={id}
        className='relative rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-all duration-300'>
        {/* Background Image with Gradient */}
        <div
          className='w-full h-64 bg-cover bg-center'
          style={{ backgroundImage: `url(${img})` }}>
          <div className='absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent'></div>
        </div>

        {/* Price/Duration Badge */}
        {/* Price/Duration Badge */}
        <div className='absolute top-4 right-4  bg-gray-100/50 bg-opacity-20 backdrop-blur-md text-black px-4 py-2 rounded-full text-md font-medium shadow-lg'>
          {tag}
        </div>

        {/* Card Content */}
        <div className='absolute bottom-0 p-4 w-full rounded-b-lg '>
          <h3 className='text-white text-lg font-medium tracking-tight'>
            {name}
          </h3>
        </div>
      </motion.div>
    </Link>
  );
};

// BlogCard component to display individual blog card
export const MapBlogCard = ({ id, title, image, date, author, category }) => {
  return (
    <motion.div
      key={id}
      className='bg-white text-start  rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300'>
      {/* Image Section */}
      <div
        className='w-full relative h-56 bg-cover bg-center'
        style={{ backgroundImage: `url(${image})` }}>
        <div className='absolute top-0 left-0 bg-black bg-opacity-40 w-full h-full'></div>
      </div>

      {/* Content Section */}
      <div className='p-4'>
        {/* Category */}

        {/* Date and Author */}
        <div className='text-sm text-gray-500 mb-2'>
          {date} | By {author}
        </div>

        {/* Title */}
        <h3 className='text-xl font-semibold text-gray-800 mb-4'>{title}</h3>

        {/* Link to full post */}
        <Link
          to={`/blog/${id}`}
          className='text-teal-500 font-medium hover:text-teal-400'>
          Read More
        </Link>
      </div>
    </motion.div>
  );
};
