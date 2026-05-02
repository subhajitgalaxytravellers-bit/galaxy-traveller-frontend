"use client";

import Image from "next/image";

export default function WhatsAppButton({ phone }) {
  if (!phone) return null; // no error—just hide CTA

  const message = encodeURIComponent("Hello! I need assistance.");
  const chatUrl = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={chatUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="
        fixed bottom-6 right-6 z-50 
        w-12 h-12 rounded-full
        bg-[#25D366]
        flex items-center justify-center
        hover:bg-[#1ebe5d] transition
        shadow-xl
      "
    >
      <Image
        src="/assets/whatapp.jpg"
        width={42}
        height={42}
        alt="WhatsApp"
        className="pointer-events-none rounded-full"
      />
    </a>
  );
}
