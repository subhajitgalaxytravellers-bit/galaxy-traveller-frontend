"use client";

export default function BookingProcessingOverlay({ open, text }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center
                 bg-white/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-lg font-medium text-gray-800">
          {text || "Booking in progress..."}
        </p>
      </div>
    </div>
  );
}
