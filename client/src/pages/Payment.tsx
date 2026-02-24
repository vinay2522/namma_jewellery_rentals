import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, XCircle, Calendar, Package } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface BookingItem {
  name: string;
  price: string;
  image: string;
}

interface PaymentBooking {
  id: string;
  name: string;
  email: string;
  phone: string;
  deliveryAddress?: string;
  items: BookingItem[];
  eventDate: string;
  rentalDuration: string;
  status: string;
  paymentStatus: string;
  amount: string | null;
}

export default function Payment() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const [, navigate] = useLocation();
  
  const [booking, setBooking] = useState<PaymentBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/payment/${bookingId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Failed to load booking");
        setLoading(false);
        return;
      }

      setBooking(data.booking);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to load booking");
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;

    setProcessing(true);
    setError(null);

    try {
      // Create payment order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.message || "Failed to create payment order");
      }

      // Initialize Razorpay
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Namma Jewellery Rentals",
        description: `Booking for ${booking.items.length} item(s)`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                bookingId: booking.id,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              setSuccess(true);
              setTimeout(() => {
                navigate("/");
              }, 3000);
            } else {
              throw new Error(verifyData.message || "Payment verification failed");
            }
          } catch (err: any) {
            setError(err.message || "Payment verification failed");
            setProcessing(false);
          }
        },
        prefill: {
          name: booking.name,
          email: booking.email,
          contact: booking.phone,
        },
        theme: {
          color: "#D4AF37",
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      setError(err.message || "Payment initiation failed");
      setProcessing(false);
    }
  };

  const calculateRentalDays = () => {
    if (!booking) return 1;
    // Extract number from duration string like "1 day", "3 days", "1 week"
    const duration = booking.rentalDuration.toLowerCase();
    if (duration.includes("week")) {
      const weeks = parseInt(duration) || 1;
      return weeks * 7;
    }
    return parseInt(duration) || 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Booking not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your booking has been confirmed. Redirecting to home page...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (booking.status !== "approved") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            This booking has not been approved yet. Payment will be available once approved.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (booking.paymentStatus === "paid") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Already Paid</CardTitle>
            <CardDescription>
              This booking has already been paid for.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const rentalDays = calculateRentalDays();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Complete Your Payment</h1>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{booking.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{booking.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{booking.phone}</p>
              </div>
              {booking.deliveryAddress && (
                <div>
                  <p className="text-sm text-muted-foreground">Delivery Address</p>
                  <p className="font-medium text-sm">{booking.deliveryAddress}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Details
                </p>
                <p className="font-medium">
                  {new Date(booking.eventDate).toLocaleDateString("en-IN", {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-muted-foreground">{booking.rentalDuration}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items and Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Items ({booking.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {booking.items.map((item, index) => (
                  <div key={index} className="flex gap-3 pb-3 border-b last:border-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <p className="text-muted-foreground">Items Subtotal</p>
                  <p className="font-medium">
                    {booking.amount ? `₹${(parseInt(booking.amount) - 50).toLocaleString("en-IN")}` : "Calculating..."}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <p className="text-muted-foreground">Delivery Fee</p>
                  <p className="font-medium">₹50</p>
                </div>

                <div className="border-t pt-3 flex justify-between items-center">
                  <p className="text-lg font-semibold">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {booking.amount ? `₹${parseInt(booking.amount).toLocaleString("en-IN")}` : "Calculating..."}
                  </p>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={processing || !booking.amount}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Spinner className="mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Pay Now"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Secure payment powered by Razorpay
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
