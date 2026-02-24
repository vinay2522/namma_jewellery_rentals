import nodemailer from "nodemailer";
import type { Booking } from "@shared/schema";

interface EmailConfig {
  service: string;
  user: string;
  pass: string;
  to: string;
}

// Email configuration from environment variables
const emailConfig: EmailConfig = {
  service: process.env.EMAIL_SERVICE || "gmail",
  user: process.env.EMAIL_USER || "",
  pass: process.env.EMAIL_PASSWORD || "",
  to: process.env.EMAIL_TO || "nammajewlleryrentals@gmail.com",
};

// Create transporter
const createTransporter = () => {
  if (!emailConfig.user || !emailConfig.pass) {
    console.warn("⚠️  Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env file");
    return null;
  }

  return nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass,
    },
  });
};

const transporter = createTransporter();

// Format booking details as HTML email
const formatBookingEmail = (booking: Booking): string => {
  const items = booking.items as any[];
  const itemsList = items
    .map(
      (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong><br>
            <small style="color: #666;">${item.category}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #c9a961;">
            ${item.price}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .accent { color: #c9a961; font-style: italic; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; }
        .badge { display: inline-block; background: #fbbf24; color: #000; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
        .info-grid { margin: 20px 0; }
        .info-item { margin-bottom: 15px; }
        .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
        .info-value { font-size: 16px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .message-box { background: #f9fafb; padding: 15px; border-left: 3px solid #c9a961; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Namma <span class="accent">Jewellery</span></h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">New Booking Request</p>
        </div>
        
        <div class="content">
          <span class="badge">PENDING</span>
          
          <h2 style="margin-top: 0; color: #1a1a1a;">Booking Details</h2>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Customer Name</div>
              <div class="info-value">${booking.fullName}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Phone Number</div>
              <div class="info-value"><a href="tel:${booking.phoneNumber}">${booking.phoneNumber}</a></div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Email Address</div>
              <div class="info-value"><a href="mailto:${booking.email}">${booking.email}</a></div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Event Date</div>
              <div class="info-value">${new Date(booking.eventDate).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</div>
            </div>
            
            <div class="info-item">
              <div class="info-label">Rental Duration</div>
              <div class="info-value">${booking.rentalDuration}</div>
            </div>
          </div>
          
          <h3 style="color: #1a1a1a; margin-top: 30px;">Selected Items (${items.length})</h3>
          <table>
            ${itemsList}
          </table>
          
          ${
            booking.message
              ? `
            <h3 style="color: #1a1a1a; margin-top: 30px;">Customer Message</h3>
            <div class="message-box">
              ${booking.message}
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 5px; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>Next Steps:</strong><br>
              1. Verify item availability for the event date<br>
              2. Contact customer to confirm booking<br>
              3. Send payment link once confirmed
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>Booking ID: ${booking.id}</p>
          <p>Submitted: ${new Date(booking.createdAt).toLocaleString("en-IN")}</p>
          <p style="margin-top: 20px;">
            <a href="http://localhost:5000/admin/bookings" style="color: #c9a961;">View in Admin Dashboard</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send booking notification email
export async function sendBookingNotification(booking: Booking): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️  Email not sent - transporter not configured");
    return false;
  }

  try {
    const mailOptions = {
      from: `"Namma Jewellery Rentals" <${emailConfig.user}>`,
      to: emailConfig.to,
      subject: `New Booking Request - ${booking.fullName}`,
      html: formatBookingEmail(booking),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return false;
  }
}

// Format customer booking confirmation email
const formatCustomerBookingConfirmation = (booking: Booking): string => {
  const items = booking.items as any[];
  const itemsList = items
    .map(
      (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong><br>
            <small style="color: #666;">${item.category}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #c9a961;">
            ${item.price}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #c9a961; margin: 0; font-size: 32px; font-family: Georgia, serif;">
            Booking Received
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Namma Jewellery Rentals
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 20px;">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            Dear <strong>${booking.fullName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your booking request! We have received your request and our team will review it shortly.
          </p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1a1a1a;">What happens next?</h2>
            <ol style="margin: 10px 0; padding-left: 20px; color: #666;">
              <li style="margin: 8px 0;">Our team will review your request</li>
              <li style="margin: 8px 0;">You'll receive an approval email with payment link</li>
              <li style="margin: 8px 0;">Complete the payment to confirm your booking</li>
              <li style="margin: 8px 0;">We'll contact you to arrange pickup/delivery</li>
            </ol>
          </div>

          <!-- Booking Details -->
          <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">
            Your Booking Details
          </h3>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Booking ID:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">#${booking.id.slice(0, 8)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Event Date:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${new Date(booking.eventDate).toLocaleDateString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Rental Duration:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${booking.rentalDuration}</td>
            </tr>
          </table>

          <!-- Items -->
          <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">
            Selected Items
          </h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsList}
          </table>

          ${booking.message ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px;">Your Note:</p>
              <p style="margin: 5px 0 0 0; color: #333;">${booking.message}</p>
            </div>
          ` : ""}

          <!-- Contact -->
          <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #c9a961; margin: 0 0 15px 0; font-size: 18px;">Need Help?</h3>
            <p style="color: #ffffff; margin: 5px 0; font-size: 14px;">
              Phone: <a href="tel:+919632598430" style="color: #c9a961; text-decoration: none;">+91 9632598430</a>
            </p>
            <p style="color: #ffffff; margin: 5px 0; font-size: 14px;">
              Email: <a href="mailto:nammajewlleryrentals@gmail.com" style="color: #c9a961; text-decoration: none;">nammajewlleryrentals@gmail.com</a>
            </p>
            <p style="color: #ffffff; margin: 5px 0; font-size: 14px;">
              Instagram: <a href="https://instagram.com/nammajewelleryrentals" style="color: #c9a961; text-decoration: none;">@nammajewelleryrentals</a>
            </p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 20px 0 0 0;">
            Thank you for choosing Namma Jewellery Rentals. We look forward to making your special day even more beautiful!
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2026 Namma Jewellery Rentals, Bangalore<br>
            This is an automated notification email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send booking confirmation to customer
export async function sendCustomerBookingConfirmation(booking: Booking): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️  Email not sent - transporter not configured");
    return false;
  }

  try {
    const mailOptions = {
      from: `"Namma Jewellery Rentals" <${emailConfig.user}>`,
      to: booking.email,
      subject: `Booking Received - ${booking.fullName}`,
      html: formatCustomerBookingConfirmation(booking),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Customer confirmation email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Customer confirmation email failed:", error);
    return false;
  }
}

// Format payment confirmation email for customer
const formatPaymentConfirmationEmail = (booking: Booking): string => {
  const items = booking.items as any[];
  const itemsList = items
    .map(
      (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong><br>
            <small style="color: #666;">${item.category}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #c9a961;">
            ${item.price}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #c9a961; margin: 0; font-size: 32px; font-family: Georgia, serif;">
            ✅ Payment Confirmed!
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Namma Jewellery Rentals
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 20px;">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            Dear <strong>${booking.fullName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
            Thank you for your payment! Your booking has been <strong style="color: #16a34a;">CONFIRMED</strong>.
          </p>

          <div style="background-color: #16a34a; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">🎉 Booking Confirmed</h2>
            <p style="margin: 0; font-size: 14px;">Payment ID: ${booking.razorpayPaymentId || "N/A"}</p>
          </div>

          <!-- Booking Details -->
          <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">
            📋 Booking Details
          </h3>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Event Date:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${new Date(booking.eventDate).toLocaleDateString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Rental Duration:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${booking.rentalDuration}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Amount Paid:</td>
              <td style="padding: 8px 0; color: #16a34a; font-weight: bold; text-align: right; font-size: 18px;">${booking.amount || "N/A"}</td>
            </tr>
          </table>

          <!-- Items -->
          <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">
            💍 Items Booked
          </h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsList}
          </table>

          <!-- Contact Info -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px;">
              📞 Next Steps
            </h3>
            <p style="color: #666; margin: 0 0 10px 0; line-height: 1.6;">
              We will contact you shortly to schedule the pickup/delivery. If you have any questions, please reach out to us:
            </p>
            <p style="color: #333; margin: 5px 0;">
              <strong>WhatsApp:</strong> +91 9632598430
            </p>
            <p style="color: #333; margin: 5px 0;">
              <strong>Email:</strong> nammajewlleryrentals@gmail.com
            </p>
            <p style="color: #333; margin: 5px 0;">
              <strong>Instagram:</strong> @nammajewelleryrentals
            </p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 20px 0 0 0;">
            Thank you for choosing Namma Jewellery Rentals. We look forward to making your special day even more beautiful!
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2026 Namma Jewellery Rentals, Bangalore<br>
            This is an automated confirmation email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send payment confirmation email to customer
export async function sendPaymentConfirmation(booking: Booking): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️  Email not sent - transporter not configured");
    return false;
  }

  try {
    const mailOptions = {
      from: `"Namma Jewellery Rentals" <${emailConfig.user}>`,
      to: booking.email,
      subject: `Payment Confirmed - Booking for ${booking.fullName}`,
      html: formatPaymentConfirmationEmail(booking),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Payment confirmation email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Payment confirmation email failed:", error);
    return false;
  }
}

// Generate WhatsApp message for payment confirmation
export function generateWhatsAppMessage(booking: Booking): string {
  const items = booking.items as any[];
  const itemNames = items.map((item: any) => item.name).join(", ");
  
  const message = `*Payment Confirmed!*

Dear ${booking.fullName},

Your booking has been confirmed! 

*Booking Details:*
Event Date: ${new Date(booking.eventDate).toLocaleDateString("en-IN")}
Duration: ${booking.rentalDuration}
Amount Paid: ${booking.amount || "N/A"}
Items: ${itemNames}

Payment ID: ${booking.razorpayPaymentId || "N/A"}

We will contact you shortly to schedule the pickup/delivery.

Thank you for choosing Namma Jewellery Rentals!

- Team Namma Jewellery Rentals
📞 +91 9632598430
📧 nammajewlleryrentals@gmail.com`;

  return encodeURIComponent(message);
}

// Get WhatsApp URL for customer notification
export function getWhatsAppURL(booking: Booking): string {
  const phoneNumber = booking.phoneNumber.replace(/\D/g, ""); // Remove non-digits
  const formattedPhone = phoneNumber.startsWith("91") ? phoneNumber : `91${phoneNumber}`;
  const message = generateWhatsAppMessage(booking);
  
  return `https://wa.me/${formattedPhone}?text=${message}`;
}

// Format approval email with payment link for customer
const formatApprovalEmail = (booking: Booking, paymentLink: string): string => {
  const items = booking.items as any[];
  const itemsList = items
    .map(
      (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong><br>
            <small style="color: #666;">${item.category}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #c9a961;">
            ${item.price}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #c9a961; margin: 0; font-size: 32px; font-family: Georgia, serif;">
            ✅ Booking Approved!
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Namma Jewellery Rentals
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 20px;">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            Dear <strong>${booking.fullName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
            Great news! Your booking request has been <strong style="color: #2563eb;">APPROVED</strong>. 
            The items you requested are available for your event date.
          </p>

          <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">📋 Next Step: Complete Payment</h2>
            <p style="margin: 10px 0; font-size: 14px;">Please complete the payment to confirm your booking</p>
          </div>

          <!-- Payment Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${paymentLink}" style="display: inline-block; background-color: #c9a961; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
              💳 Pay Now
            </a>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">
              Or copy this link: <a href="${paymentLink}" style="color: #2563eb;">${paymentLink}</a>
            </p>
          </div>

          <!-- Booking Details -->
          <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">
            📋 Booking Details
          </h3>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Event Date:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${new Date(booking.eventDate).toLocaleDateString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Rental Duration:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${booking.rentalDuration}</td>
            </tr>
          </table>

          <!-- Items -->
          <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">
            💍 Selected Items
          </h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsList}
          </table>

          <!-- Important Note -->
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
              <strong>⚠️ Important:</strong> Please complete the payment within 24 hours to secure your booking. 
              Items are subject to availability until payment is confirmed.
            </p>
          </div>

          <!-- Contact Info -->
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 16px;">
              📞 Need Help?
            </h3>
            <p style="color: #666; margin: 0 0 10px 0; line-height: 1.6;">
              If you have any questions or need assistance with payment, feel free to contact us:
            </p>
            <p style="color: #333; margin: 5px 0;">
              <strong>WhatsApp:</strong> +91 9632598430
            </p>
            <p style="color: #333; margin: 5px 0;">
              <strong>Email:</strong> nammajewlleryrentals@gmail.com
            </p>
            <p style="color: #333; margin: 5px 0;">
              <strong>Instagram:</strong> @nammajewelleryrentals
            </p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 20px 0 0 0;">
            Thank you for choosing Namma Jewellery Rentals. We look forward to making your special day even more beautiful!
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2026 Namma Jewellery Rentals, Bangalore<br>
            This is an automated notification email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send approval notification with payment link to customer
export async function sendApprovalNotification(booking: Booking, paymentLink: string): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️  Email not sent - transporter not configured");
    return false;
  }

  try {
    const mailOptions = {
      from: `"Namma Jewellery Rentals" <${emailConfig.user}>`,
      to: booking.email,
      subject: `Booking Approved - Payment Link for ${booking.fullName}`,
      html: formatApprovalEmail(booking, paymentLink),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Approval email sent to customer:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Approval email failed:", error);
    return false;
  }
}

// Generate WhatsApp message for approval notification
export function generateApprovalWhatsAppMessage(booking: Booking, paymentLink: string): string {
  const items = booking.items as any[];
  const itemNames = items.map((item: any) => item.name).join(", ");
  
  const message = `*Booking Approved!*

Dear ${booking.fullName},

Great news! Your booking has been approved!

*Booking Details:*
Event Date: ${new Date(booking.eventDate).toLocaleDateString("en-IN")}
Duration: ${booking.rentalDuration}
Items: ${itemNames}

*Next Step: Complete Payment*
Please click the link below to make payment and confirm your booking:

${paymentLink}

*Important:* Please complete payment within 24 hours to secure your booking.

Need help? Contact us anytime!
Phone: +91 9632598430
Email: nammajewlleryrentals@gmail.com

Thank you for choosing Namma Jewellery Rentals!

- Team Namma Jewellery Rentals`;

  return encodeURIComponent(message);
}

// Get WhatsApp URL for approval notification
export function getApprovalWhatsAppURL(booking: Booking, paymentLink: string): string {
  const phoneNumber = booking.phoneNumber.replace(/\D/g, ""); // Remove non-digits
  const formattedPhone = phoneNumber.startsWith("91") ? phoneNumber : `91${phoneNumber}`;
  const message = generateApprovalWhatsAppMessage(booking, paymentLink);
  
  return `https://wa.me/${formattedPhone}?text=${message}`;
}

// Format rejection email for customer
const formatRejectionEmail = (booking: Booking, reason?: string): string => {
  const items = booking.items as any[];
  const itemsList = items
    .map(
      (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            <strong>${item.name}</strong><br>
            <small style="color: #666;">${item.category}</small>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #c9a961;">
            ${item.price}
          </td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #c9a961; margin: 0; font-size: 32px; font-family: Georgia, serif;">
            Booking Update
          </h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">
            Namma Jewellery Rentals
          </p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 20px;">
          <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">
            Dear <strong>${booking.fullName}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin: 0 0 20px 0;">
            We regret to inform you that we are unable to fulfill your booking request at this time.
          </p>

          <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">Booking Not Available</h2>
            <p style="margin: 0; font-size: 14px;">We apologize for any inconvenience</p>
          </div>

          ${reason ? `
            <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #991b1b; font-weight: bold; font-size: 14px;">Reason:</p>
              <p style="margin: 5px 0 0 0; color: #7f1d1d;">${reason}</p>
            </div>
          ` : ""}

          <!-- Booking Details -->
          <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">
            Your Request Details
          </h3>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Event Date:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${new Date(booking.eventDate).toLocaleDateString("en-IN")}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Rental Duration:</td>
              <td style="padding: 8px 0; color: #333; font-weight: bold; text-align: right;">${booking.rentalDuration}</td>
            </tr>
          </table>

          <!-- Items -->
          <h3 style="color: #1a1a1a; margin: 30px 0 15px 0; font-size: 18px; border-bottom: 2px solid #c9a961; padding-bottom: 10px;">
            Requested Items
          </h3>
          
          <table style="width: 100%; border-collapse: collapse;">
            ${itemsList}
          </table>

          <!-- Alternative Options -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #1a1a1a; margin: 0 0 15px 0; font-size: 18px;">We'd Love to Help!</h3>
            <p style="margin: 0 0 10px 0; color: #666; line-height: 1.6;">
              Please feel free to:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li style="margin: 8px 0;">Try alternative dates for your event</li>
              <li style="margin: 8px 0;">Browse our catalogue for similar items</li>
              <li style="margin: 8px 0;">Contact us to discuss other options</li>
            </ul>
          </div>

          <!-- Contact -->
          <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <h3 style="color: #c9a961; margin: 0 0 15px 0; font-size: 18px;">Contact Us</h3>
            <p style="color: #ffffff; margin: 5px 0; font-size: 14px;">
              Phone: <a href="tel:+919632598430" style="color: #c9a961; text-decoration: none;">+91 9632598430</a>
            </p>
            <p style="color: #ffffff; margin: 5px 0; font-size: 14px;">
              Email: <a href="mailto:nammajewlleryrentals@gmail.com" style="color: #c9a961; text-decoration: none;">nammajewlleryrentals@gmail.com</a>
            </p>
            <p style="color: #ffffff; margin: 5px 0; font-size: 14px;">
              Instagram: <a href="https://instagram.com/nammajewelleryrentals" style="color: #c9a961; text-decoration: none;">@nammajewelleryrentals</a>
            </p>
          </div>

          <p style="font-size: 14px; color: #666; line-height: 1.6; margin: 20px 0 0 0;">
            We appreciate your interest in Namma Jewellery Rentals and hope to serve you in the future!
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
          <p style="color: #999; margin: 0; font-size: 12px;">
            © 2026 Namma Jewellery Rentals, Bangalore<br>
            This is an automated notification email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send rejection notification to customer
export async function sendRejectionNotification(booking: Booking, reason?: string): Promise<boolean> {
  if (!transporter) {
    console.warn("⚠️  Email not sent - transporter not configured");
    return false;
  }

  try {
    const mailOptions = {
      from: `"Namma Jewellery Rentals" <${emailConfig.user}>`,
      to: booking.email,
      subject: `Booking Update - ${booking.fullName}`,
      html: formatRejectionEmail(booking, reason),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Rejection email sent to customer:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Rejection email failed:", error);
    return false;
  }
}

// Generate WhatsApp message for rejection notification
export function generateRejectionWhatsAppMessage(booking: Booking, reason?: string): string {
  const items = booking.items as any[];
  const itemNames = items.map((item: any) => item.name).join(", ");
  
  const message = `*Booking Update*

Dear ${booking.fullName},

We regret to inform you that we are unable to fulfill your booking request at this time.

*Booking Details:*
Event Date: ${new Date(booking.eventDate).toLocaleDateString("en-IN")}
Duration: ${booking.rentalDuration}
Items: ${itemNames}

${reason ? `*Reason:* ${reason}\n\n` : ""}We apologize for any inconvenience. Please feel free to:
- Try alternative dates for your event
- Browse our catalogue for similar items
- Contact us to discuss other options

*Contact Us:*
Phone: +91 9632598430
Email: nammajewlleryrentals@gmail.com
Instagram: @nammajewelleryrentals

We appreciate your interest and hope to serve you in the future!

- Team Namma Jewellery Rentals`;

  return encodeURIComponent(message);
}

// Get WhatsApp URL for rejection notification
export function getRejectionWhatsAppURL(booking: Booking, reason?: string): string {
  const phoneNumber = booking.phoneNumber.replace(/\D/g, ""); // Remove non-digits
  const formattedPhone = phoneNumber.startsWith("91") ? phoneNumber : `91${phoneNumber}`;
  const message = generateRejectionWhatsAppMessage(booking, reason);
  
  return `https://wa.me/${formattedPhone}?text=${message}`;
}
