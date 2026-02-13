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
  Bell,
  Search,
  Menu,
  ChevronRight,
  User,
  ShoppingCart,
  Heart,
  Package,
} from "lucide-react";
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
    ],
  },
};

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);

  const config = roleConfig[role];
  const RoleIcon = config.icon;

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
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300 flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
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
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-sm font-bold text-foreground">Lab2Home</h2>
              <p className="text-xs text-muted-foreground">{config.title}</p>
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
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 text-sm font-normal transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" strokeWidth={1.5} />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {isActive && <ChevronRight className="h-4 w-4" strokeWidth={2} />}
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
        {sidebarOpen && user && (
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
      <div className={cn("transition-all duration-300", sidebarOpen ? "ml-64" : "ml-20")}>
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
