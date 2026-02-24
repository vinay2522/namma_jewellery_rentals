import type { Booking } from "@shared/schema";

export function bookingsToCSV(bookings: Booking[]): string {
  // CSV Header
  const headers = [
    "Booking ID",
    "Date Submitted",
    "Status",
    "Customer Name",
    "Phone",
    "Email",
    "Event Date",
    "Rental Duration",
    "Items Count",
    "Items Details",
    "Message",
  ];

  // Convert bookings to CSV rows
  const rows = bookings.map((booking) => {
    const items = booking.items as any[];
    const itemsDetails = items
      .map((item) => `${item.name} (${item.category}) - ${item.price}`)
      .join("; ");

    return [
      booking.id,
      new Date(booking.createdAt).toLocaleString("en-IN"),
      booking.status.toUpperCase(),
      booking.fullName,
      booking.phoneNumber,
      booking.email,
      new Date(booking.eventDate).toLocaleDateString("en-IN"),
      booking.rentalDuration,
      items.length.toString(),
      `"${itemsDetails}"`, // Quoted to handle commas
      booking.message ? `"${booking.message.replace(/"/g, '""')}"` : "", // Escape quotes
    ];
  });

  // Combine header and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}
