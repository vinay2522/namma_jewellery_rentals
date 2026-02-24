import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema } from "@shared/schema";
import { sendBookingNotification, sendPaymentConfirmation, getWhatsAppURL, sendApprovalNotification, getApprovalWhatsAppURL, sendCustomerBookingConfirmation, sendRejectionNotification, getRejectionWhatsAppURL } from "./email";
import { bookingsToCSV } from "./csv-export";
import { requireAuth, loginAdmin, logoutAdmin, AuthRequest } from "./auth";
import { createPaymentOrder, verifyPaymentSignature, calculateBookingAmount } from "./payment";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required",
        });
      }
      
      const isValid = await loginAdmin(username, password, req.session);
      
      if (isValid) {
        res.json({
          success: true,
          message: "Login successful",
        });
      } else {
        res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Login failed",
      });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    logoutAdmin(req.session);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  });

  // Check auth status
  app.get("/api/admin/check", (req, res) => {
    const authReq = req as AuthRequest;
    res.json({
      success: true,
      isAuthenticated: authReq.session.isAuthenticated || false,
    });
  });
  // Create a new booking
  app.post("/api/bookings", async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      
      // Send admin notification email (async, don't wait)
      sendBookingNotification(booking).catch((err) => {
        console.error("Failed to send admin notification:", err);
      });
      
      // Send customer confirmation email (async, don't wait)
      sendCustomerBookingConfirmation(booking).catch((err) => {
        console.error("Failed to send customer confirmation:", err);
      });
      
      res.status(201).json({
        success: true,
        message: "Booking request submitted successfully",
        booking,
      });
    } catch (error: any) {
      console.error("Booking creation error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create booking",
        errors: error.errors || undefined,
      });
    }
  });

  // Get all bookings (for admin) - PROTECTED
  app.get("/api/bookings", requireAuth, async (_req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json({ success: true, bookings });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch bookings",
      });
    }
  });

  // Track bookings by email or phone (for customers)
  app.get("/api/bookings/track", async (req, res) => {
    try {
      const { email, phone } = req.query;

      if (!email && !phone) {
        return res.status(400).json({
          success: false,
          message: "Please provide either email or phone number",
        });
      }

      const allBookings = await storage.getAllBookings();
      
      let bookings = allBookings;
      if (email) {
        bookings = allBookings.filter(b => 
          b.email.toLowerCase() === (email as string).toLowerCase()
        );
      } else if (phone) {
        const searchPhone = (phone as string).replace(/\D/g, "");
        bookings = allBookings.filter(b => 
          b.phoneNumber.replace(/\D/g, "").includes(searchPhone)
        );
      }

      // Sort by most recent first
      bookings.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json({
        success: true,
        bookings,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch bookings",
      });
    }
  });

  // Download bookings as CSV - PROTECTED
  app.get("/api/bookings/export/csv", requireAuth, async (_req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      const csv = bookingsToCSV(bookings);
      
      const filename = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to export bookings",
      });
    }
  });

  // Get a single booking - PROTECTED
  app.get("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }
      res.json({ success: true, booking });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch booking",
      });
    }
  });

  // Update booking status - PROTECTED
  app.patch("/api/bookings/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }
      
      const booking = await storage.updateBookingStatus(req.params.id, status);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // If booking is approved, send notification to customer
      if (status === "approved") {
        const paymentLink = `${req.protocol}://${req.get("host")}/payment/${booking.id}`;
        
        // Send approval email (async, don't wait)
        sendApprovalNotification(booking, paymentLink).catch((err) => {
          console.error("Failed to send approval email:", err);
        });

        // Generate WhatsApp URL for admin to send
        const whatsappURL = getApprovalWhatsAppURL(booking, paymentLink);
        console.log("\n📱 Booking Approved - Send WhatsApp:");
        console.log(`   Customer: ${booking.fullName} (${booking.phoneNumber})`);
        console.log(`   Open this URL to send approval:\n   ${whatsappURL}\n`);
        
        // Return WhatsApp URL to frontend
        return res.json({
          success: true,
          message: "Booking approved and notification sent",
          booking,
          whatsappURL,
        });
      }

      // If booking is rejected, send notification to customer
      if (status === "rejected") {
        // Send rejection email (async, don't wait)
        sendRejectionNotification(booking).catch((err) => {
          console.error("Failed to send rejection email:", err);
        });

        // Generate WhatsApp URL for admin to send
        const whatsappURL = getRejectionWhatsAppURL(booking);
        console.log("\n📱 Booking Rejected - Send WhatsApp:");
        console.log(`   Customer: ${booking.fullName} (${booking.phoneNumber})`);
        console.log(`   Open this URL to send notification:\n   ${whatsappURL}\n`);
        
        // Return WhatsApp URL to frontend
        return res.json({
          success: true,
          message: "Booking rejected and notification sent",
          booking,
          whatsappURL,
        });
      }
      
      res.json({
        success: true,
        message: "Booking status updated",
        booking,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update booking",
      });
    }
  });

  // Delete booking - PROTECTED
  app.delete("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteBooking(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }
      
      res.json({
        success: true,
        message: "Booking deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete booking",
      });
    }
  });

  // Create payment order - PUBLIC (customer access)
  app.post("/api/payment/create-order", async (req, res) => {
    try {
      const { bookingId } = req.body;
      
      if (!bookingId) {
        return res.status(400).json({
          success: false,
          message: "Booking ID is required",
        });
      }

      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Only allow payment if booking is approved
      if (booking.status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Booking must be approved before payment",
        });
      }

      // Calculate amount (includes delivery fee)
      const amount = calculateBookingAmount(booking);
      
      // Create Razorpay order
      const order = await createPaymentOrder(amount, bookingId, booking.email, booking.fullName);
      
      // Update booking with order ID and amount
      await storage.updateBookingPayment(bookingId, {
        razorpayOrderId: order.id,
        amount: amount.toString(),
        paymentStatus: "pending",
      });

      res.json({
        success: true,
        orderId: order.id,
        amount: amount * 100, // Send in paise
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error: any) {
      console.error("Payment order creation failed:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create payment order",
      });
    }
  });

  // Verify payment - PUBLIC (customer access)
  app.post("/api/payment/verify", async (req, res) => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
        return res.status(400).json({
          success: false,
          message: "Missing payment verification parameters",
        });
      }

      // Verify signature
      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment signature",
        });
      }

      // Update booking payment status
      const booking = await storage.updateBookingPayment(bookingId, {
        razorpayPaymentId,
        paymentStatus: "paid",
      });

      // Also update booking status to confirmed
      await storage.updateBookingStatus(bookingId, "confirmed");

      // Get updated booking for notifications
      const confirmedBooking = await storage.getBooking(bookingId);

      if (confirmedBooking) {
        // Send confirmation email to customer (async, don't wait)
        sendPaymentConfirmation(confirmedBooking).catch((err) => {
          console.error("Failed to send payment confirmation email:", err);
        });

        // Generate WhatsApp URL for admin to send manually
        const whatsappURL = getWhatsAppURL(confirmedBooking);
        console.log("\n📱 WhatsApp Confirmation:");
        console.log(`   Customer: ${confirmedBooking.fullName} (${confirmedBooking.phoneNumber})`);
        console.log(`   Open this URL to send WhatsApp confirmation:\n   ${whatsappURL}\n`);
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        booking,
      });
    } catch (error: any) {
      console.error("Payment verification failed:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Payment verification failed",
      });
    }
  });

  // Get booking for payment page - PUBLIC (customer access with booking ID)
  app.get("/api/payment/:bookingId", async (req, res) => {
    try {
      const booking = await storage.getBooking(req.params.bookingId);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Calculate total amount from items if not already set
      let totalAmount = booking.amount;
      if (!totalAmount) {
        const items = booking.items as any[];
        const rentalDuration = booking.rentalDuration.toLowerCase();
        
        // Extract number of days
        let days = 1;
        if (rentalDuration.includes("week")) {
          const weeks = parseInt(rentalDuration) || 1;
          days = weeks * 7;
        } else {
          days = parseInt(rentalDuration) || 1;
        }
        
        // Calculate total from items
        let itemsTotal = 0;
        items.forEach((item: any) => {
          // Extract numeric value from price string like "₹3,200/day"
          const priceMatch = item.price.match(/[\d,]+/);
          if (priceMatch) {
            const price = parseInt(priceMatch[0].replace(/,/g, ""));
            itemsTotal += price * days;
          }
        });
        
        // Add delivery fee of ₹50
        const deliveryFee = 50;
        const total = itemsTotal + deliveryFee;
        totalAmount = total.toString();
        
        // Update booking with calculated amount
        await storage.updateBookingPayment(booking.id, {
          amount: totalAmount,
        });
      }

      // Return booking details for payment page
      res.json({
        success: true,
        booking: {
          id: booking.id,
          name: booking.fullName,
          email: booking.email,
          phone: booking.phoneNumber,
          deliveryAddress: booking.deliveryAddress,
          items: booking.items,
          eventDate: booking.eventDate,
          rentalDuration: booking.rentalDuration,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          amount: totalAmount,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch booking",
      });
    }
  });

  return httpServer;
}
