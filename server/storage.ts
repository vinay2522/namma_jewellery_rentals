import { type User, type InsertUser, type Booking, type InsertBooking } from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// File paths for persistent storage
const DATA_DIR = join(process.cwd(), "data");
const BOOKINGS_FILE = join(DATA_DIR, "bookings.json");
const USERS_FILE = join(DATA_DIR, "users.json");

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions to read/write JSON files
function readJSONFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }
  return defaultValue;
}

function writeJSONFile<T>(filePath: string, data: T): void {
  try {
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error(`Error writing ${filePath}:`, error);
  }
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Booking methods
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBooking(id: string): Promise<Booking | undefined>;
  getAllBookings(): Promise<Booking[]>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  updateBookingPayment(
    id: string,
    paymentData: {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      paymentStatus?: string;
      amount?: string;
    }
  ): Promise<Booking | undefined>;
  deleteBooking(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.users = new Map();
    this.bookings = new Map();
    
    // Load existing bookings from file
    this.loadBookingsFromFile();
    console.log(`📚 Loaded ${this.bookings.size} bookings from storage`);
  }

  private loadBookingsFromFile(): void {
    const bookingsArray = readJSONFile<Booking[]>(BOOKINGS_FILE, []);
    bookingsArray.forEach((booking) => {
      // Convert date strings back to Date objects
      booking.createdAt = new Date(booking.createdAt);
      this.bookings.set(booking.id, booking);
    });
  }

  private saveBookingsToFile(): void {
    const bookingsArray = Array.from(this.bookings.values());
    writeJSONFile(BOOKINGS_FILE, bookingsArray);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      status: "pending",
      paymentStatus: "unpaid",
      razorpayOrderId: null,
      razorpayPaymentId: null,
      amount: null,
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    this.saveBookingsToFile(); // Save to file immediately
    console.log(`💾 Saved booking ${id} to file`);
    return booking;
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (booking) {
      booking.status = status;
      this.bookings.set(id, booking);
      this.saveBookingsToFile(); // Save to file immediately
      console.log(`💾 Updated booking ${id} status to ${status}`);
      return booking;
    }
    return undefined;
  }

  async updateBookingPayment(
    id: string,
    paymentData: {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      paymentStatus?: string;
      amount?: string;
    }
  ): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (booking) {
      if (paymentData.razorpayOrderId !== undefined) booking.razorpayOrderId = paymentData.razorpayOrderId;
      if (paymentData.razorpayPaymentId !== undefined) booking.razorpayPaymentId = paymentData.razorpayPaymentId;
      if (paymentData.paymentStatus !== undefined) booking.paymentStatus = paymentData.paymentStatus;
      if (paymentData.amount !== undefined) booking.amount = paymentData.amount;
      
      this.bookings.set(id, booking);
      this.saveBookingsToFile();
      console.log(`💾 Updated booking ${id} payment details`);
      return booking;
    }
    return undefined;
  }

  async deleteBooking(id: string): Promise<boolean> {
    const exists = this.bookings.has(id);
    if (exists) {
      this.bookings.delete(id);
      this.saveBookingsToFile();
      console.log(`🗑️  Deleted booking ${id}`);
      return true;
    }
    return false;
  }
}

export const storage = new MemStorage();
