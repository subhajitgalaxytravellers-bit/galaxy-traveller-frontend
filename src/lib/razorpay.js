// lib/razorpay.js
import client from "@/api/client";

/* ------------------------------------------------------
   Fetch enabled payment gateways
------------------------------------------------------ */
export async function getPaymentGateways() {
  const res = await client.get("/payment-gateways");
  return res?.data?.data || [];
}

/* ------------------------------------------------------
   Create Razorpay Order (backend decides amount)
------------------------------------------------------ */
export async function createPayment({
  gateway = "razorpay",
  bookingId,
  paymentMode,
}) {
  if (!bookingId) {
    throw new Error("bookingId is required");
  }

  const res = await client.post("/payment/create", {
    gateway,
    bookingId,
    paymentMode,
  });

  return res?.data?.data;
}
