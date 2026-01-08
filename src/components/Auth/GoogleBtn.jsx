"use client";
import { useGoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import { toast } from "react-toastify";

export default function ModernGoogleButton({ onSuccess, onError }) {
  const login = useGoogleLogin({
    flow: "implicit", // uses the token flow
    scope: "openid email profile",
    onSuccess: async (tokenResponse) => {
      try {
        // console.log("Google login success:", tokenResponse);

        onSuccess?.(tokenResponse); // Pass the whole token data upward
      } catch (err) {
        console.error("Google success handling error:", err);
        toast.error("Something went wrong during login handling.");
      }
    },
    onError: (err) => {
      console.error("Google Login Error:", err);
      toast.error("Google login failed. Please try again.");
      onError?.(err);
    },
  });

  return (
    <button
      onClick={() => login()}
      className="flex items-center justify-center gap-2 w-full py-3 rounded-md border border-gray-300 bg-white hover:bg-gray-50 shadow-sm transition-all duration-200"
    >
      <Image
        src="https://developers.google.com/identity/images/g-logo.png"
        alt="Google logo"
        width={20}
        height={20}
        className="w-5 h-5"
      />
      <span className="text-gray-700 font-medium">Continue with Google</span>
    </button>
  );
}
