import { useCart } from "@/hooks/use-cart";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X, ShoppingBag } from "lucide-react";
import { useState } from "react";

export default function CartDrawer() {
  const { items, removeFromCart, clearCart } = useCart();
  const [open, setOpen] = useState(false);

  const handleProceedToBooking = () => {
    setOpen(false);
    setTimeout(() => {
      const bookingSection = document.getElementById("booking");
      if (bookingSection) bookingSection.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {items.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            Your Cart
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 flex flex-col h-[calc(100vh-200px)]">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-xl mb-2 text-muted-foreground">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground">Add some beautiful jewelry pieces to get started</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 bg-muted/30 p-4 border border-border">
                    <div className="w-24 h-24 flex-shrink-0 bg-muted overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-sm mb-1 line-clamp-2">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{item.category}</p>
                      <p className="text-primary font-medium text-sm">{item.price}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t space-y-3">
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-muted-foreground">Items in cart:</span>
                  <span className="font-semibold">{items.length} piece{items.length !== 1 ? 's' : ''}</span>
                </div>
                
                <Button
                  onClick={handleProceedToBooking}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 tracking-wider uppercase text-sm"
                >
                  Proceed to Booking
                </Button>
                
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full h-10 text-xs tracking-wider uppercase"
                >
                  Clear Cart
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
