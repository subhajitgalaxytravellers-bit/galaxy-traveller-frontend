import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function PaymentDialog({
  showBookingModal,
  setShowBookingModal,

  /** REQUIRED PROPS */
  tourName,
  tourLocation,
  dateRange,
  guests,
  amount, // FULL AMOUNT ALWAYS
  fullLabel = "Full Payment",
  paymentMode, // "full" or "partial" (initial mode)
  paymentConfig,
  coupon, // { code, discount }
  availableCoupons = [],
  couponsLoading = false,
  onSelectCoupon,
  onConfirmPayment,
}) {
  const { adults, children } = guests;
  const totalGuests = adults + children;

  const startDate = dateRange?.startDate;
  const endDate = dateRange?.endDate;

  const formatRs = (value = 0) =>
    `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

  // FIX: fullAmount = raw full amount
  const fullAmount = Number(amount || 0);
  const couponDiscount = Number(coupon?.discount || 0);
  const netAmount = Math.max(0, fullAmount - couponDiscount);

  // Allow parent to pass absolute partial total, otherwise fall back to per-guest price
  const partialTotalOverride = Number(paymentConfig?.partial?.totalAmount || 0);

  // FIX: partial uses configured price * guests (unless override provided)
  const basePartialAmount = paymentConfig?.partial?.enabled
    ? partialTotalOverride > 0
      ? partialTotalOverride
      : Number(paymentConfig.partial.price || 0) * totalGuests
    : netAmount;

  // Apply coupon proportionally to partial amount so upfront shrinks with discount
  const partialRatio = fullAmount > 0 ? basePartialAmount / fullAmount : 1;
  const partialAmount = Math.min(
    Math.max(0, Math.round(netAmount * partialRatio)),
    netAmount
  );

  // FIX: Always default to FULL unless partial is allowed & parent explicitly asked partial
  const [selectedPayment, setSelectedPayment] = useState("full");
  const [selectedCoupon, setSelectedCoupon] = useState(coupon?.code || "none");

  useEffect(() => {
    if (!paymentConfig?.partial?.enabled && selectedPayment !== "full") {
      setSelectedPayment("full");
    }
  }, [paymentConfig?.partial?.enabled, selectedPayment]);

  useEffect(() => {
    let active = true;
    const updateSelection = async () => {
      const next =
        paymentMode === "partial" && paymentConfig?.partial?.enabled
          ? "partial"
          : "full";
      if (active) setSelectedPayment(next);
    };
    updateSelection();
    return () => {
      active = false;
    };
  }, [paymentMode, paymentConfig]);

  useEffect(() => {
    setSelectedCoupon(coupon?.code || "none");
  }, [coupon]);

  // FIX: final amount must always compute using correct full / partial logic
  const finalPayable =
    selectedPayment === "partial" && paymentConfig?.partial?.enabled
      ? Math.min(partialAmount, netAmount)
      : netAmount;

  const displayCoupons = (() => {
    const list = [...availableCoupons];
    if (coupon?.code && !list.find((c) => c.code === coupon.code)) {
      list.push({
        code: coupon.code,
        discount: coupon.discount,
        message: coupon.message,
        type: coupon.type,
        value: coupon.value,
        maxOff: coupon.maxOff,
      });
    }
    return list;
  })();

  const handleCouponSelect = (code) => {
    setSelectedCoupon(code);
    if (onSelectCoupon) {
      const next = displayCoupons.find((c) => c.code === code) || null;
      onSelectCoupon(next);
    }
  };

  const handlePayment = async () => {
    // CLOSE payment dialog immediately
    setShowBookingModal(false);

    // Notify parent to start blocking overlay + API
    onConfirmPayment({
      tourName,
      tourLocation,
      startDate,
      endDate,
      guests,
      selectedPayment,
      finalPayable,
      coupon: selectedCoupon === "none" ? null : coupon,
    });
  };

  return (
    <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Confirm Your Booking
          </DialogTitle>
          <DialogDescription>
            Review your trip details before proceeding to payment.
          </DialogDescription>
        </DialogHeader>

        {/* Trip Summary */}
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span>Tour:</span>
            <span className="font-medium">{tourName}</span>
          </div>

          {tourLocation && (
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="font-medium">{tourLocation}</span>
            </div>
          )}

          {startDate && endDate && (
            <div className="flex justify-between">
              <span>Dates:</span>
              <span className="font-medium">
                {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Guests:</span>
            <span className="font-medium">
              {adults} adults
              {children > 0 && `, ${children} children`}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-medium">{formatRs(netAmount)}</span>
          </div>

          {couponDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Coupon ({coupon?.code}):</span>
              <span>-{formatRs(couponDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold text-foreground">
            <span>Total payable:</span>
            <span>{formatRs(netAmount)}</span>
          </div>
        </div>

        {/* Coupon Selector */}
        <div className="space-y-2 mb-2">
          <Label className="font-medium">Apply Coupon</Label>
          <Select
            value={selectedCoupon}
            onValueChange={handleCouponSelect}
            disabled={couponsLoading || displayCoupons.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  couponsLoading
                    ? "Loading coupons..."
                    : displayCoupons.length === 0
                    ? "No active coupons for this tour"
                    : "Choose a coupon"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No coupon</SelectItem>
              {displayCoupons.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} •{" "}
                  {c.message ||
                    (c.discount ? `Rs. ${c.discount} off` : "Available")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {selectedCoupon === "none"
              ? "Select a coupon to reduce your payable amount."
              : couponDiscount > 0
              ? `You save ${formatRs(couponDiscount)} on this booking.`
              : "Coupon will apply at checkout if eligible."}
          </p>
        </div>

        {/* Payment Options */}
        {paymentConfig.partial.enabled && (
          <div className="space-y-3 my-3">
            <Label className="font-medium">Payment Method</Label>

            <RadioGroup
              value={selectedPayment}
              onValueChange={setSelectedPayment}
            >
              {/* FULL PAYMENT ALWAYS AVAILABLE */}

              <div className="flex items-center gap-2 border p-3 rounded">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full">
                  {fullLabel} – {formatRs(netAmount)}
                </Label>
              </div>

              {/* PARTIAL ONLY IF ENABLED */}
              {paymentConfig.partial.enabled && (
                <div className="flex items-center gap-2 border p-3 rounded">
                  <RadioGroupItem value="partial" id="partial" />
                  <Label htmlFor="partial">
                    Partial Payment – {formatRs(partialAmount)}
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>
        )}

        <Button onClick={handlePayment} className="w-full h-12 mt-4">
          Pay {formatRs(finalPayable)}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
