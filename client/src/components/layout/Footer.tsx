export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-2">
          <h3 className="font-serif text-3xl mb-4">Namma Jewellery Rentals</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Premium bridal jewellery on rent in Bangalore. Experience the luxury of wearing exquisite temple, kundan, and antique designs for your special day.
          </p>
        </div>
        <div>
          <h4 className="font-serif text-xl mb-4 text-primary">Links</h4>
          <ul className="space-y-3 text-sm text-muted-foreground uppercase tracking-widest">
            <li><a href="#categories" className="hover:text-white transition-colors">Categories</a></li>
            <li><a href="#catalogue" className="hover:text-white transition-colors">Catalogue</a></li>
            <li><a href="#process" className="hover:text-white transition-colors">Payment Process</a></li>
            <li><a href="#booking" className="hover:text-white transition-colors">Safety & Terms</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-serif text-xl mb-4 text-primary">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>Bangalore, India</li>
            <li><a href="mailto:nammajewlleryrentals@gmail.com" className="hover:text-white transition-colors">Email Us</a></li>
            <li><a href="https://wa.me/919632598430" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp: +91 96325 98430</a></li>
            <li><a href="https://www.instagram.com/nammajewelleryrentals/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
          </ul>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-white/10 text-center text-sm text-muted-foreground uppercase tracking-wider">
        <p>&copy; {new Date().getFullYear()} Namma Jewellery Rentals. All rights reserved.</p>
      </div>
    </footer>
  );
}
