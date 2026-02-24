import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Mail, Phone, Package, Clock, CheckCircle2, XCircle, Download, LogOut, Copy, ExternalLink, Trash2, MessageCircle } from "lucide-react";

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: string;
}

interface Booking {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  eventDate: string;
  rentalDuration: string;
  items: CartItem[];
  message?: string;
  status: string;
  paymentStatus?: string;
  amount?: string | null;
  razorpayOrderId?: string | null;
  createdAt: string;
}

const statusColors = {
  pending: "bg-yellow-500",
  approved: "bg-blue-500",
  confirmed: "bg-green-500",
  completed: "bg-emerald-500",
  cancelled: "bg-red-500",
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { requireAuth, logout, isLoading: authLoading, isAuthenticated } = useAuth();

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/bookings");
      const result = await response.json();
      
      if (result.success) {
        setBookings(result.bookings);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load bookings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        // Handle rejection with WhatsApp notification
        if (status === "rejected" || status === "cancelled") {
          toast({
            title: "Booking Rejected",
            description: "Email sent to customer. WhatsApp opened to send notification.",
            duration: 5000,
          });

          // Open WhatsApp with rejection message
          if (result.whatsappURL) {
            window.open(result.whatsappURL, "_blank");
          }
        } else {
          toast({
            title: "Status Updated",
            description: `Booking marked as ${status}`,
          });
        }
        
        fetchBookings(); // Refresh bookings
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const approveBooking = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      });

      const result = await response.json();

      if (result.success) {
        const paymentLink = `${window.location.origin}/payment/${id}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(paymentLink);
        
        toast({
          title: "Booking Approved ✅",
          description: "Email sent to customer. WhatsApp opened to send confirmation.",
          duration: 5000,
        });

        // Open WhatsApp with approval message
        if (result.whatsappURL) {
          window.open(result.whatsappURL, "_blank");
        }

        // Refresh bookings
        fetchBookings();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyPaymentLink = async (id: string) => {
    const paymentLink = `${window.location.origin}/payment/${id}`;
    await navigator.clipboard.writeText(paymentLink);
    
    toast({
      title: "Payment Link Copied",
      description: "Share this link with the customer to collect payment",
      duration: 3000,
    });
  };

  const deleteBooking = async (id: string, customerName: string) => {
    if (!confirm(`Are you sure you want to delete the booking for ${customerName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Booking Deleted",
          description: "The booking has been permanently removed",
        });
        fetchBookings(); // Refresh list
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppNotification = (booking: Booking) => {
    const items = booking.items.map((item: any) => item.name).join(", ");
    const message = `*Booking Update*\n\nDear ${booking.fullName},\n\nYour booking has been *${booking.status.toUpperCase()}*!\n\n*Details:*\nEvent Date: ${new Date(booking.eventDate).toLocaleDateString("en-IN")}\nDuration: ${booking.rentalDuration}\nItems: ${items}\n\n${booking.status === "approved" ? `Please complete payment using this link:\n${window.location.origin}/payment/${booking.id}\n\n` : ""}Thank you for choosing Namma Jewellery Rentals!\n\n- Team Namma Jewellery Rentals\nPhone: +91 9632598430`;
    
    const phoneNumber = booking.phoneNumber.replace(/\D/g, "");
    const formattedPhone = phoneNumber.startsWith("91") ? phoneNumber : `91${phoneNumber}`;
    const whatsappURL = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappURL, "_blank");
    
    toast({
      title: "WhatsApp Opened",
      description: "Send the message to notify the customer",
      duration: 3000,
    });
  };

  useEffect(() => {
    // Wait for auth check to complete
    if (authLoading) return;
    
    // Redirect if not authenticated
    if (!isAuthenticated) {
      requireAuth();
      return;
    }
    
    // Fetch bookings only when authenticated
    fetchBookings();
  }, [authLoading, isAuthenticated]);

  const downloadCSV = () => {
    window.location.href = "/api/bookings/export/csv";
    toast({
      title: "Download Started",
      description: "Your bookings CSV file is being downloaded",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl mb-8">Booking Requests</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-4xl mb-2">Booking Requests</h1>
          <p className="text-muted-foreground text-sm">
            All bookings are automatically saved to <code className="bg-muted px-2 py-1 rounded text-xs">data/bookings.json</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-lg px-4 py-2">
            {bookings.length} Total
          </Badge>
          <Button onClick={downloadCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            CSV
          </Button>
          <Button onClick={logout} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-2xl mb-2">No Bookings Yet</h3>
          <p className="text-muted-foreground">
            Booking requests will appear here once customers submit them.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-2xl mb-1">{booking.fullName}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={statusColors[booking.status as keyof typeof statusColors]}>
                      {booking.status.toUpperCase()}
                    </Badge>
                    {booking.paymentStatus && (
                      <Badge variant={booking.paymentStatus === "paid" ? "default" : "outline"}>
                        {booking.paymentStatus === "paid" ? "PAID" : "PAYMENT PENDING"}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(booking.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-col">
                  {booking.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => approveBooking(booking.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve & Send Payment Link
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(booking.id, "rejected")}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {booking.status === "approved" && booking.paymentStatus !== "paid" && (
                    <div className="flex gap-2 items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPaymentLink(booking.id)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Payment Link
                      </Button>
                      <a
                        href={`/payment/${booking.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteBooking(booking.id, booking.fullName)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${booking.phoneNumber}`} className="hover:underline">
                    {booking.phoneNumber}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${booking.email}`} className="hover:underline">
                    {booking.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(booking.eventDate).toLocaleDateString("en-IN")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{booking.rentalDuration}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                  Selected Items ({booking.items.length})
                </h4>
                <div className="bg-muted/30 p-4 rounded space-y-2">
                  {booking.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                      <span className="text-primary font-medium">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {booking.message && (
                <div className="bg-muted/30 p-4 rounded">
                  <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                    Message
                  </h4>
                  <p className="text-sm">{booking.message}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
