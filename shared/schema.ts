import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  eventDate: text("event_date").notNull(),
  rentalDuration: text("rental_duration").notNull(),
  items: jsonb("items").notNull(), // Array of cart items
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, approved, payment_pending, paid, cancelled
  paymentStatus: text("payment_status").default("unpaid"), // unpaid, paid, refunded
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  amount: text("amount"), // Total booking amount
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings, {
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Invalid email address"),
  deliveryAddress: z.string().min(10, "Please enter your complete delivery address"),
  eventDate: z.string().min(1, "Event date is required"),
  rentalDuration: z.string().min(1, "Rental duration is required"),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    price: z.string(),
  })).min(1, "At least one item must be selected"),
  message: z.string().optional(),
}).omit({
  id: true,
  status: true,
  paymentStatus: true,
  razorpayOrderId: true,
  razorpayPaymentId: true,
  amount: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;
