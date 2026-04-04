import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, UserPlus, LogIn, LogOut, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logo from "/logo.svg";

// Traditional flat navigation items
const navLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/#services" },
  { name: "Features", href: "/#features" },
  { name: "About Us", href: "/about" },
  { name: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header
        className={`fixed z-50 transition-all duration-500 w-full md:w-[90%] md:max-w-6xl md:left-1/2 md:-translate-x-1/2 ${
          isScrolled
            ? "top-0 md:top-4 bg-background/80 dark:bg-card/80 backdrop-blur-xl border-b md:border border-border/50 shadow-lg md:rounded-full py-3"
            : "top-0 md:top-6 bg-transparent md:bg-background/40 md:backdrop-blur-md md:border border-transparent md:border-border/20 md:shadow-sm md:rounded-full py-4 md:py-3"
        }`}
      >
        <div className="px-6 md:px-8 w-full">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group z-50 shrink-0">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <img
                  src={logo}
                  alt="Lab2Home"
                  className="h-full w-full origin-center scale-[1.8] object-contain"
                />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block">
                <span className="text-foreground">Lab2</span>
                <span className="text-primary">Home</span>
              </span>
            </Link>

            {/* Desktop Traditional Navigation */}
            <nav className="hidden md:flex items-center gap-1 justify-center relative">
              {navLinks.map((link, index) => {
                const isActive = location.pathname === link.href || (location.pathname === '/' && location.hash === '' && link.href === '/') || (link.href.includes('#') && location.hash === link.href.substring(link.href.indexOf('#')));
                
                return (
                <Link
                  key={link.name}
                  to={link.href}
                  className="relative px-4 py-2 text-sm font-medium transition-colors"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span
                    className={`relative z-10 ${
                      isActive ? "text-primary font-semibold" : "text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    {link.name}
                  </span>
                  
                  {/* Hover Pill Background */}
                  {hoveredIndex === index && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary/10 rounded-full z-0"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  
                  {/* Active Indicator */}
                  {isActive && hoveredIndex !== index && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full z-0"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </Link>
              )})}
            </nav>

            {/* Desktop CTA Buttons */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3 shrink-0">
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
                >
                  Log Out
                </Button>
                <Button
                  asChild
                  className="rounded-full px-6 shadow-soft hover:shadow-medium transition-all group font-medium"
                >
                  <Link to={`/${user?.role || ''}`}>
                    Dashboard
                    <Activity className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3 shrink-0">
                <Button
                  variant="ghost"
                  asChild
                  className="font-medium hover:bg-primary/10 hover:text-primary transition-colors rounded-full"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full px-6 shadow-soft hover:shadow-medium transition-all group font-medium"
                >
                  <Link to="/signup">
                    Get Started
                    <UserPlus className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden relative z-50 p-2 text-foreground/80 hover:text-primary transition-colors focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Fullscreen Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-xl z-40 md:hidden flex flex-col pt-24 pb-8 px-6"
          >
            <div className="flex-1 overflow-y-auto flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={link.href}
                    className="block text-2xl py-4 font-medium text-foreground hover:text-primary hover:translate-x-2 transition-all border-b border-border/30"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-3 pt-6 shrink-0"
            >
              {isAuthenticated ? (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="w-full justify-center border-primary/20 text-primary hover:bg-primary/5 rounded-xl h-14"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Log Out
                  </Button>
                  <Button size="lg" asChild className="w-full justify-center shadow-medium text-base rounded-xl h-14">
                    <Link to={`/${user?.role || ''}`}>
                      <Activity className="w-5 h-5 mr-3" />
                      Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    asChild
                    className="w-full justify-center border-primary/20 text-primary hover:bg-primary/5 rounded-xl h-14"
                  >
                    <Link to="/login">
                      <LogIn className="w-5 h-5 mr-3" />
                      Sign In
                    </Link>
                  </Button>
                  <Button size="lg" asChild className="w-full justify-center shadow-medium text-base rounded-xl h-14">
                    <Link to="/signup">
                      <UserPlus className="w-5 h-5 mr-3" />
                      Create Account
                    </Link>
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
