import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  TestTube,
  FileText,
  ShoppingBag,
  MessageSquare,
  Settings,
  LogOut,
  Activity,
  Users,
  Calendar,
  Building2,
  Menu,
  ChevronRight,
  User,
  ShoppingCart,
  Heart,
  Package,
  Star,
  X,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationBell from "./NotificationBell";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "patient" | "lab" | "phlebotomist" | "admin";
}

// Role-based navigation configuration
const roleConfig = {
  patient: {
    title: "Patient Portal",
    icon: Activity,
    color: "primary",
    nav: [
      { name: "Dashboard", path: "/patient", icon: LayoutDashboard },
      { name: "Book Test", path: "/patient/book-test", icon: TestTube },
      { name: "My Reports", path: "/patient/reports", icon: FileText },
      { name: "Marketplace", path: "/patient/marketplace", icon: ShoppingBag },
      { name: "My Cart", path: "/patient/cart", icon: ShoppingCart },
      { name: "Wishlist", path: "/patient/wishlist", icon: Heart },
      { name: "My Orders", path: "/patient/orders", icon: Package },
      { name: "Messages", path: "/patient/messages", icon: MessageSquare },
      { name: "My Reviews", path: "/patient/my-reviews", icon: Star },
      { name: "Rate Phlebotomist", path: "/patient/rate-phlebotomist", icon: TestTube },
    ],
  },
  lab: {
    title: "Laboratory Portal",
    icon: Building2,
    color: "secondary",
    nav: [
      { name: "Dashboard", path: "/lab", icon: LayoutDashboard },
      { name: "Test Selection", path: "/lab/test-selection", icon: TestTube },
      { name: "Appointments", path: "/lab/appointments", icon: Calendar },
      { name: "Upload Reports", path: "/lab/reports", icon: FileText },
      { name: "Messages", path: "/lab/messages", icon: MessageSquare },
      { name: "Reviews", path: "/lab/reviews", icon: Star },
    ],
  },
  phlebotomist: {
    title: "Phlebotomist Portal",
    icon: Activity,
    color: "accent",
    nav: [
      { name: "Dashboard", path: "/phlebotomist", icon: LayoutDashboard },
      { name: "Appointments", path: "/phlebotomist/appointments", icon: Calendar },
      { name: "Sample Collection", path: "/phlebotomist/samples", icon: TestTube },
      { name: "Messages", path: "/phlebotomist/messages", icon: MessageSquare },
      { name: "Reviews", path: "/phlebotomist/reviews", icon: Star },
    ],
  },
  admin: {
    title: "Admin Portal",
    icon: Settings,
    color: "destructive",
    nav: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Manage Patients", path: "/admin/patients", icon: Users },
      { name: "Manage Labs", path: "/admin/labs", icon: Building2 },
      { name: "Manage Phlebotomists", path: "/admin/phlebotomists", icon: Users },
      { name: "Diagnostic Tests", path: "/admin/tests", icon: TestTube },
      { name: "Marketplace", path: "/admin/marketplace", icon: ShoppingBag },
      { name: "Product Reviews", path: "/admin/product-reviews", icon: Star },
    ],
  },
};

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

  const config = roleConfig[role];
  const RoleIcon = config.icon;

  /** Desktop: wide sidebar vs icon rail. Mobile drawer: show labels when open. */
  const expanded = isMobile ? mobileMenuOpen : sidebarOpen;

  React.useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  React.useEffect(() => {
    if (isMobile && mobileMenuOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isMobile, mobileMenuOpen]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) setMobileMenuOpen((o) => !o);
    else setSidebarOpen((o) => !o);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";

    // For admin or users without fullName, use email initials
    if (!user.fullName) {
      const emailPart = user.email.split('@')[0];
      return emailPart.substring(0, 2).toUpperCase();
    }

    const names = user.fullName.split(" ");
    return names.length > 1
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {isMobile && mobileMenuOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isMobile && !mobileMenuOpen ? "-100%" : 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className={cn(
          "fixed left-0 top-0 h-screen border-r border-border bg-card flex flex-col overflow-y-auto overscroll-contain",
          isMobile ? "z-50 w-[min(18rem,calc(100vw-1rem))] shadow-xl" : cn("z-40", sidebarOpen ? "w-64" : "w-20")
        )}
      >
        {/* Logo/Header */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition-transform hover:scale-105",
              role === "patient" && "bg-primary/10 text-primary",
              role === "lab" && "bg-secondary/10 text-secondary",
              role === "phlebotomist" && "bg-accent/10 text-accent",
              role === "admin" && "bg-destructive/10 text-destructive"
            )}
          >
            <RoleIcon className="h-5 w-5" />
          </div>
          {expanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="min-w-0"
            >
              <h2 className="text-sm font-bold text-foreground truncate">Lab2Home</h2>
              <p className="text-xs text-muted-foreground truncate">{config.title}</p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 flex-shrink-0">
          <ul className="space-y-0.5">
            {config.nav.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <motion.li
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => isMobile && setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-normal transition-colors rounded-lg",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                    {expanded && (
                      <>
                        <span className="flex-1 min-w-0 truncate">{item.name}</span>
                        {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" strokeWidth={2} />}
                      </>
                    )}
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        {/* Flexible spacer to push everything below to the bottom */}
        <div className="flex-1" />

        {/* User Profile - Fixed at bottom with dropdown */}
        {expanded && user && (
          <div className="border-t border-border p-4 flex-shrink-0 relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center gap-3 w-full hover:bg-muted/50 rounded-lg p-2 transition-colors"
            >
              <Avatar className="h-10 w-10 border-2 border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.fullName || (role === 'admin' ? 'Administrator' : 'User')}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-4 right-4 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
              >
                <div className="py-2">
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate(`/${role}`);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <User className="h-5 w-5" strokeWidth={1.5} />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      // Navigate to change password page
                      window.location.href = `/${role}/change-password`;
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Settings className="h-5 w-5" strokeWidth={1.5} />
                    <span>Change Password</span>
                  </button>
                  <div className="px-4 py-2">
                    <button
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={2} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.aside>

      {/* Main Content */}
      <div
        className={cn(
          "min-w-0 transition-[margin] duration-300",
          isMobile ? "ml-0" : sidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 min-w-0 items-center justify-between gap-2 border-b border-border bg-card/80 backdrop-blur-xl px-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl shrink-0"
              onClick={toggleSidebar}
              aria-expanded={isMobile ? mobileMenuOpen : sidebarOpen}
              aria-label={isMobile && mobileMenuOpen ? "Close navigation menu" : "Toggle navigation menu"}
            >
              {isMobile && mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
