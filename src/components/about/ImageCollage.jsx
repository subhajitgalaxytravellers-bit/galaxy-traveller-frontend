import Image from "next/image";
import React from "react";

const ImageCollage = ({ img1, img2, img3 }) => {
  return (
    <div className="relative lg:w-1/2 flex justify-center items-center gap-2">
      {/* First Image */}
      <div className="relative group overflow-hidden rounded-xl">
        <Image
          src={img1}
          alt="Destination"
          width={240}
          height={240}
          className="h-[15rem] object-cover aspect-square shadow-lg group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="flex flex-col gap-2 ">
        {/* Second Image */}
        <div className="relative group overflow-hidden rounded-xl">
          <Image
            src={img2}
            alt="Adventure"
            width={320}
            height={320}
            className="h-[20rem] aspect-square object-cover rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-500"
          />
        </div>

        {/* Third Image */}
        <div className="relative h-[10rem] w-[10rem] group aspect-square overflow-hidden rounded-xl">
          <Image
            src={img3}
            alt="Relaxation"
            width={160}
            height={160}
            className="h-[10rem] aspect-square object-cover rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageCollage;
