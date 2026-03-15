import { Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Lab2Home</h3>
            <p className="text-background/80 mb-4 max-w-md">
              Lab at Your Doorstep, Care at Your Fingertips. Bringing professional diagnostic services to your home with AI-powered report interpretation.
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                <Mail className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                <Phone className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-background/80">
              <li>
                <Link to="/signup" className="hover:text-background transition-colors">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-background transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/#services" className="hover:text-background transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="hover:text-background transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-background transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-background/80">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">+92 306 2221078</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">lab2home.help@gmail.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-background/60 text-sm">
          <p>© 2025 Lab2Home. All rights reserved. | Supervised by Mahzaib Younus</p>
          <p className="mt-2">Developed by Muhammad Usman Awan, Faizan Ahmad, Muhammad Ahmad</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
