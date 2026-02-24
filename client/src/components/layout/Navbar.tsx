import { Link } from "wouter";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl md:text-3xl font-semibold tracking-wide text-foreground">
          Namma <span className="text-primary italic">Jewellery</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          <a href="#categories" className="hover:text-primary transition-colors">Categories</a>
          <a href="#catalogue" className="hover:text-primary transition-colors">Catalogue</a>
          <a href="#process" className="hover:text-primary transition-colors">Process</a>
          <Link href="/track-order" className="hover:text-primary transition-colors">Track Order</Link>
          <a href="#booking" className="hover:text-primary transition-colors">Book Now</a>
        </nav>
        <div className="flex items-center gap-3">
          <CartDrawer />
          <a href="#booking" className="bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors hidden sm:block">
            Book Appointment
          </a>
        </div>
      </div>
    </header>
  );
}
