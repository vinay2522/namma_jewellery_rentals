import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/use-cart";
import { MessageCircle, Instagram, ShieldCheck, CreditCard, CheckCircle2, ShoppingCart } from "lucide-react";

import heroImg from "@/assets/images/hero.png";
import templeImg from "@/assets/images/temple.png";
import kundanImg from "@/assets/images/kundan.png";
import antiqueImg from "@/assets/images/antique.png";

const products = [
  { id: "Temple_Bridal_Set_01", name: "Royal Annapakshi Temple Set", category: "Temple Jewellery", price: "₹100/day", image: templeImg },
  { id: "Kundan_Choker_01", name: "Jodhpuri Kundan Choker", category: "Kundan Jewellery", price: "₹100/day", image: kundanImg },
  { id: "Antique_Laxmi_01", name: "Antique Goddess Laxmi Haar", category: "Antique Bridal", price: "₹100/day", image: antiqueImg },
];

export default function Home() {
  const { toast } = useToast();
  const { items: cartItems, addToCart, isInCart, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add jewelry items to your cart before booking.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Store form reference before async operations
    const form = e.currentTarget;

    try {
      const formData = new FormData(form);
      const bookingData = {
        fullName: formData.get("fullName") as string,
        phoneNumber: formData.get("phoneNumber") as string,
        email: formData.get("email") as string,
        deliveryAddress: formData.get("deliveryAddress") as string,
        eventDate: formData.get("eventDate") as string,
        rentalDuration: formData.get("rentalDuration") as string,
        message: formData.get("message") as string,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
        })),
      };

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bookingData),
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error. Please make sure the server is running.");
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Booking Request Submitted",
          description: "Our team will verify availability and send you a payment link shortly.",
        });
        
        // Reset form and clear cart
        form.reset();
        clearCart();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or contact us via WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = (product: typeof products[0]) => {
    if (isInCart(product.id)) {
      toast({
        title: "Already in cart",
        description: `${product.name} is already in your cart.`,
      });
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: product.image,
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-foreground">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Bridal Jewellery" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/50 to-transparent" />
        </div>
        
        <div className="container relative z-10 px-4 text-background">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <span className="text-primary font-medium tracking-widest uppercase mb-4 block" data-testid="text-hero-subtitle">Namma Jewellery Rentals</span>
            <h1 className="font-serif text-5xl md:text-7xl leading-tight mb-6" data-testid="text-hero-title">
              Bridal Jewellery on Rent in <i className="text-primary font-light">Bangalore</i>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
              Experience the luxury of exquisite temple, kundan, and antique designs for your special day without the commitment of purchase.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button size="lg" className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 text-sm tracking-wider uppercase px-8" onClick={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })} data-testid="button-book-website">
                Book via Website
              </Button>
              <Button size="lg" variant="outline" className="rounded-none border-primary/50 text-white hover:bg-primary hover:text-primary-foreground text-sm tracking-wider uppercase bg-black/20 backdrop-blur-sm" asChild data-testid="button-book-whatsapp">
                <a href="https://wa.me/919632598430" target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button size="lg" variant="outline" className="rounded-none border-primary/50 text-white hover:bg-primary hover:text-primary-foreground text-sm tracking-wider uppercase bg-black/20 backdrop-blur-sm" asChild data-testid="button-book-instagram">
                <a href="https://www.instagram.com/nammajewelleryrentals/" target="_blank" rel="noreferrer">
                  <Instagram className="mr-2 h-4 w-4" /> Instagram
                </a>
              </Button>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-white/80 bg-white/10 px-5 py-3 w-max backdrop-blur-md border border-white/10" data-testid="status-payment-info">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-medium tracking-wide">Payments accepted after confirmation only. No automatic checkout.</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="py-24 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl mb-6">Curated Collections</h2>
            <div className="w-16 h-1 bg-primary mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Temple Jewellery", img: templeImg },
              { name: "Kundan Jewellery", img: kundanImg },
              { name: "Antique Bridal", img: antiqueImg }
            ].map((cat, i) => (
              <div key={i} className="group relative aspect-[3/4] overflow-hidden bg-muted cursor-pointer" data-testid={`card-category-${i}`}>
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-serif text-3xl text-background mb-4">{cat.name}</h3>
                  <span className="text-primary text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2">
                    <div className="w-8 h-[1px] bg-primary"></div> Explore
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT CATALOGUE */}
      <section id="catalogue" className="py-24 bg-muted/40">
        <div className="container px-4">
          <div className="mb-16 text-center">
            <h2 className="font-serif text-4xl md:text-5xl mb-6">Featured Pieces</h2>
            <div className="w-16 h-1 bg-primary mx-auto"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {products.map((product, idx) => (
              <div key={product.id} className="bg-card group hover:shadow-2xl transition-shadow duration-500 border border-border/50" data-testid={`card-product-${idx}`}>
                <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-8 text-center">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{product.category}</div>
                  <h4 className="font-serif text-2xl mb-4 text-foreground">{product.name}</h4>
                  <div className="text-primary font-medium tracking-wide mb-8 text-lg">{product.price}</div>
                  <Button 
                    className="w-full rounded-none tracking-widest uppercase text-xs h-12" 
                    variant={isInCart(product.id) ? "secondary" : "outline"}
                    onClick={() => handleAddToCart(product)}
                    disabled={isInCart(product.id)}
                    data-testid={`button-book-${product.id}`}
                  >
                    {isInCart(product.id) ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        In Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PAYMENT FLOW */}
      <section id="process" className="py-24 bg-foreground text-background">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <span className="text-primary font-medium tracking-widest uppercase mb-4 block">The Process</span>
            <h2 className="font-serif text-4xl md:text-5xl mb-6 text-white">How It Works</h2>
            <div className="w-16 h-1 bg-primary mx-auto mb-8"></div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We follow a strict manual approval process to ensure availability and quality for your special day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-center max-w-6xl mx-auto relative">
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-[1px] bg-white/10 z-0"></div>
            
            {[
              { step: 1, title: "Submit Request", desc: "Via website booking form" },
              { step: 2, title: "Verification", desc: "Admin checks availability" },
              { step: 3, title: "Payment Link", desc: "Secure link sent to you" },
              { step: 4, title: "Complete Payment", desc: "Credit/Debit/UPI accepted" },
              { step: 5, title: "Confirmed", desc: "Pickup appointment scheduled" }
            ].map((s) => (
              <div key={s.step} className="relative z-10 flex flex-col items-center group">
                <div className="w-16 h-16 rounded-full bg-foreground border border-white/20 text-white flex items-center justify-center font-serif text-2xl mb-6 group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all duration-300">
                  {s.step}
                </div>
                <h5 className="font-medium text-white mb-2 tracking-wide">{s.title}</h5>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-24 max-w-3xl mx-auto bg-white/5 p-10 border border-white/10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <CreditCard className="w-12 h-12 text-primary flex-shrink-0" />
            <div className="text-center sm:text-left">
              <h4 className="font-serif text-2xl text-white mb-3">Secure Payments</h4>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                We use secure payment gateways (Razorpay, Cashfree). Payments are ONLY accepted via official links sent after booking confirmation. 
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-medium uppercase tracking-wider text-primary">
                <span className="bg-primary/10 px-3 py-1 rounded-full">Credit Card</span>
                <span className="bg-primary/10 px-3 py-1 rounded-full">Net Banking</span>
                <span className="bg-primary/10 px-3 py-1 rounded-full">UPI (GPay, PhonePe)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING FORM & SAFETY */}
      <section id="booking" className="py-24 bg-background">
        <div className="container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 max-w-6xl mx-auto">
            
            {/* Form */}
            <div className="lg:col-span-7 bg-card p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-border">
              <span className="text-primary font-medium tracking-widest uppercase mb-3 block">Get in touch</span>
              <h2 className="font-serif text-4xl mb-4">Request a Booking</h2>
              <p className="text-muted-foreground text-sm mb-10 flex items-center gap-2 bg-muted/50 p-4 border-l-2 border-primary">
                <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                This is a booking request only. Our team will verify and confirm availability.
              </p>

              <form onSubmit={handleBookingSubmit} className="space-y-8" data-testid="form-booking">
                {/* Cart Items Summary */}
                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Selected Items ({cartItems.length})</label>
                  {cartItems.length > 0 ? (
                    <div className="bg-muted/30 border border-border p-4 space-y-3 max-h-48 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 text-sm">
                          <div className="w-12 h-12 bg-muted flex-shrink-0">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.category} • {item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-muted/30 border border-border p-6 text-center">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No items in cart. Add jewelry from the catalogue above.</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <Input required name="fullName" placeholder="Bride's Name" className="rounded-none h-12 bg-transparent border-t-0 border-x-0 border-b-border rounded-b-none focus-visible:ring-0 focus-visible:border-b-primary px-0 text-lg" data-testid="input-name" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Phone Number</label>
                    <Input required name="phoneNumber" type="tel" placeholder="+91" className="rounded-none h-12 bg-transparent border-t-0 border-x-0 border-b-border rounded-b-none focus-visible:ring-0 focus-visible:border-b-primary px-0 text-lg" data-testid="input-phone" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Event Date</label>
                    <Input required name="eventDate" type="date" className="rounded-none h-12 bg-transparent border-t-0 border-x-0 border-b-border rounded-b-none focus-visible:ring-0 focus-visible:border-b-primary px-0 text-lg" data-testid="input-date" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rental Duration</label>
                    <Input required name="rentalDuration" placeholder="e.g., 2 days" className="rounded-none h-12 bg-transparent border-t-0 border-x-0 border-b-border rounded-b-none focus-visible:ring-0 focus-visible:border-b-primary px-0 text-lg" data-testid="input-duration" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email Address</label>
                  <Input 
                    required 
                    name="email"
                    type="email"
                    placeholder="your@email.com" 
                    className="rounded-none h-12 bg-transparent border-t-0 border-x-0 border-b-border rounded-b-none focus-visible:ring-0 focus-visible:border-b-primary px-0 text-lg" 
                    data-testid="input-email"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Delivery Address *</label>
                  <Textarea 
                    required 
                    name="deliveryAddress"
                    placeholder="Complete address for delivery (House/Flat No., Street, Area, City, Pincode)" 
                    className="rounded-none min-h-[80px] bg-transparent border-t-0 border-x-0 border-b-border rounded-b-none focus-visible:ring-0 focus-visible:border-b-primary px-0 text-lg resize-none" 
                    data-testid="input-address"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Delivery charge: ₹50</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Additional Message</label>
                  <Textarea name="message" placeholder="Any specific requirements?" className="rounded-none min-h-[100px] bg-transparent border-t-0 border-x-0 border-b-border rounded-b-none focus-visible:ring-0 focus-visible:border-b-primary px-0 text-lg resize-none" data-testid="input-message" />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-14 tracking-widest uppercase font-medium disabled:opacity-50" 
                  data-testid="button-submit-booking"
                >
                  {isSubmitting ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </div>

            {/* Safety & Terms */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <span className="text-primary font-medium tracking-widest uppercase mb-3 block">Important</span>
              <h3 className="font-serif text-3xl mb-10">Safety & Terms</h3>
              
              <ul className="space-y-8">
                {[
                  "Booking is strictly subject to product availability for your dates.",
                  "A mandatory refundable security deposit applies to all rentals.",
                  "Pickup & return is currently available in Bangalore only.",
                  "No shipping or courier services are provided to prevent damage.",
                  "No automatic payments. Beware of fraudulent links.",
                  "Damage or loss policy applies as per the rental agreement."
                ].map((term, i) => (
                  <li key={i} className="flex gap-5 items-start">
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    </div>
                    <span className="text-foreground leading-relaxed font-medium text-sm">{term}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-14 p-8 bg-muted/30 border border-border">
                <h4 className="font-medium mb-3 uppercase tracking-wider text-sm">Need Help?</h4>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  Our bridal consultants are available on WhatsApp to help you choose the perfect set for your wedding functions.
                </p>
                <Button variant="outline" className="w-full rounded-none border-primary text-primary hover:bg-primary hover:text-primary-foreground tracking-widest uppercase text-xs h-12" asChild>
                  <a href="https://wa.me/919632598430" target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 w-4 h-4" /> Chat with Consultant
                  </a>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
