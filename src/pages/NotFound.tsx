import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import CardNav from "@/components/home/CardNav";
import logo from "/logo.svg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const navItems = [
    {
      label: "Services",
      bgColor: "hsl(200 85% 45%)",
      textColor: "#fff",
      links: [
        { label: "Diagnostic Tests", href: "/", ariaLabel: "View diagnostic tests" },
        { label: "Home Collection", href: "/", ariaLabel: "Home sample collection" },
        { label: "AI Reports", href: "/", ariaLabel: "AI-powered report analysis" }
      ]
    },
    {
      label: "About",
      bgColor: "hsl(180 65% 50%)",
      textColor: "#fff",
      links: [
        { label: "How It Works", href: "/", ariaLabel: "Learn how it works" },
        { label: "Our Team", href: "/", ariaLabel: "Meet our team" }
      ]
    },
    {
      label: "Contact",
      bgColor: "hsl(150 70% 45%)",
      textColor: "#fff",
      links: [
        { label: "Support", href: "/", ariaLabel: "Contact support" },
        { label: "Book Test", href: "/signup", ariaLabel: "Book a test" }
      ]
    }
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted">
      <CardNav
        logo={logo}
        logoAlt="Lab2Home Logo"
        items={navItems}
        baseColor="#fff"
        menuColor="hsl(200 85% 45%)"
        buttonLink="/signup"
      />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
