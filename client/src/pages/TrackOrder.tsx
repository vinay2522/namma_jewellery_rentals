import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Package, Calendar, CheckCircle2, Clock, XCircle, CreditCard } from "lucide-react";

interface BookingItem {
  name: string;
  price: string;
  category: string;
}

interface Booking {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  eventDate: string;
  rentalDuration: string;
  items: BookingItem[];
  message?: string;
  status: string;
  paymentStatus: string;
  amount?: string;
  createdAt: string;
}

export default function TrackOrder() {
  const [searchType, setSearchType] = useState<"email" | "phone">("email");
  const [searchValue, setSearchValue] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      setError(`Please enter your ${searchType}`);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(`/api/bookings/track?${searchType}=${encodeURIComponent(searchValue)}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.message || "Failed to fetch bookings");
        setBookings([]);
        setLoading(false);
        return;
      }

      setBookings(data.bookings || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Failed to fetch bookings");
      setBookings([]);
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pending Review", variant: "secondary" },
      approved: { label: "Approved", variant: "default" },
      rejected: { label: "Rejected", variant: "destructive" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentBadge = (paymentStatus: string) => {
    if (paymentStatus === "paid") {
      return <Badge className="bg-green-500">Paid</Badge>;
    }
    return <Badge variant="outline">Unpaid</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "rejected":
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Track Your Orders</h1>
        <p className="text-muted-foreground mb-6">
          Enter your email or phone number to view your booking history
        </p>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Your Bookings</CardTitle>
            <CardDescription>
              Use the same email or phone number you provided during booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-4 mb-4">
                <Button
                  type="button"
                  variant={searchType === "email" ? "default" : "outline"}
                  onClick={() => setSearchType("email")}
                  className="flex-1"
                >
                  Search by Email
                </Button>
                <Button
                  type="button"
                  variant={searchType === "phone" ? "default" : "outline"}
                  onClick={() => setSearchType("phone")}
                  className="flex-1"
                >
                  Search by Phone
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">
                  {searchType === "email" ? "Email Address" : "Phone Number"}
                </Label>
                <Input
                  id="search"
                  type={searchType === "email" ? "email" : "tel"}
                  placeholder={
                    searchType === "email"
                      ? "your@email.com"
                      : "+91 9876543210"
                  }
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner className="mr-2" /> : null}
                Search Bookings
              </Button>
            </form>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {loading && (
          <div className="flex justify-center py-8">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {!loading && searched && bookings.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">No Bookings Found</p>
              <p className="text-muted-foreground">
                We couldn't find any bookings with this {searchType}.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && bookings.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">
              Your Bookings ({bookings.length})
            </h2>

            {bookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(booking.status)}
                      <div>
                        <CardTitle className="text-lg">
                          Booking #{booking.id.slice(0, 8)}
                        </CardTitle>
                        <CardDescription>
                          Booked on {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric"
                          })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(booking.status)}
                      {getPaymentBadge(booking.paymentStatus)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event Details */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Event Date
                      </p>
                      <p className="font-medium">
                        {new Date(booking.eventDate).toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {booking.rentalDuration}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment
                      </p>
                      <p className="font-medium">
                        {booking.amount ? `₹${booking.amount}` : "Pending"}
                      </p>
                      {booking.status === "approved" && booking.paymentStatus !== "paid" && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={() => window.location.href = `/payment/${booking.id}`}
                        >
                          Complete Payment
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Items ({booking.items.length})
                    </p>
                    <div className="space-y-2">
                      {booking.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.category}
                            </p>
                          </div>
                          <p className="text-primary font-medium">{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  {booking.message && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Your Note</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">
                        {booking.message}
                      </p>
                    </div>
                  )}

                  {/* Status Message */}
                  {booking.status === "pending" && (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Your booking is under review. We'll contact you soon!
                      </AlertDescription>
                    </Alert>
                  )}

                  {booking.status === "approved" && booking.paymentStatus !== "paid" && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Your booking is approved! Please complete the payment to confirm.
                      </AlertDescription>
                    </Alert>
                  )}

                  {booking.status === "approved" && booking.paymentStatus === "paid" && (
                    <Alert className="border-green-500 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-900">
                        Payment confirmed! We'll contact you to arrange pickup/delivery.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
