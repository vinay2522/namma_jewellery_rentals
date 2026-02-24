import Razorpay from "razorpay";
import type { Booking } from "@shared/schema";

// Razorpay configuration
const razorpayConfig = {
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
};

let razorpayInstance: any = null;

function getRazorpayInstance() {
  if (!razorpayConfig.key_id || !razorpayConfig.key_secret) {
    console.warn("⚠️  Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env");
    return null;
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay(razorpayConfig);
  }

  return razorpayInstance;
}

// Calculate total amount from booking items
export function calculateBookingAmount(booking: Booking): number {
  const items = booking.items as any[];
  
  // Extract price from string like "₹4,500/day"
  const totalPerDay = items.reduce((sum, item) => {
    const priceStr = item.price.replace(/[₹,]/g, "").split("/")[0];
    return sum + parseFloat(priceStr);
  }, 0);

  // Get duration (extract number from string like "2 days" or "1 week")
  const rentalDuration = booking.rentalDuration.toLowerCase();
  let days = 1;
  if (rentalDuration.includes("week")) {
    const weeks = parseInt(rentalDuration) || 1;
    days = weeks * 7;
  } else {
    const durationMatch = rentalDuration.match(/\d+/);
    days = durationMatch ? parseInt(durationMatch[0]) : 1;
  }

  // Calculate subtotal and add delivery fee
  const subtotal = totalPerDay * days;
  const deliveryFee = 50;
  
  return subtotal + deliveryFee;
}

// Create Razorpay order
export async function createPaymentOrder(
  amount: number,
  bookingId: string,
  customerEmail: string,
  customerName: string
): Promise<any | null> {
  const razorpay = getRazorpayInstance();
  
  if (!razorpay) {
    throw new Error("Razorpay not configured");
  }

  try {
    const amountInPaise = Math.round(amount * 100); // Convert to paise

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: bookingId,
      notes: {
        bookingId: bookingId,
        customerName: customerName,
        customerEmail: customerEmail,
      },
    });

    console.log(`✅ Created Razorpay order ${order.id} for booking ${bookingId}`);

    return order;
  } catch (error) {
    console.error("❌ Failed to create Razorpay order:", error);
    throw error;
  }
}

// Verify payment signature
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const razorpay = getRazorpayInstance();
  
  if (!razorpay) {
    return false;
  }

  try {
    const crypto = require("crypto");
    const generated_signature = crypto
      .createHmac("sha256", razorpayConfig.key_secret)
      .update(orderId + "|" + paymentId)
      .digest("hex");

    return generated_signature === signature;
  } catch (error) {
    console.error("❌ Payment verification failed:", error);
    return false;
  }
}

// Get payment link for booking
export function getPaymentLink(bookingId: string): string {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  return `${baseUrl}/payment/${bookingId}`;
}
