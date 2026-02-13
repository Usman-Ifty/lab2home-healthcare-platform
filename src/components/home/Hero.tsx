import { Button } from "@/components/ui/button";
import { Calendar, Sparkles, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import Squares from "./Squares";
import CardNav from "./CardNav";
import SplitText from "@/components/shared/SplitText";
import { publicNavItems } from "@/config/public-nav";
import logo from "/logo.svg";

const Hero = () => {
  /* navItems removed */

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      <CardNav
        logo={logo}
        logoAlt="Lab2Home Logo"
        items={publicNavItems}
        baseColor="#fff"
        menuColor="hsl(200 85% 45%)"
      />
      <Squares speed={0.5} squareSize={40} direction="diagonal" />

      <div className="relative z-10 container mx-auto px-4 py-20 pointer-events-none">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 shadow-soft mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              AI-Powered Healthcare at Home
            </span>
          </div>

          {/* Main Heading */}
          <div className="mb-6">
            <SplitText
              text="Lab at Your DoorSteps"
              tag="h1"
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight"
              splitType="chars"
              delay={50}
              duration={0.8}
              ease="power3.out"
              from={{ opacity: 0, y: 50 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.3}
              rootMargin="0px"
            />
          </div>

          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            Care at Your Fingertips
          </p>

          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Book home blood sample collection, track your tests in real-time, and get AI-powered
            interpretation of your lab reports—all from the comfort of your home.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 pointer-events-auto">
            <Button
              size="lg"
              className="group text-lg px-8 py-6 shadow-medium hover:shadow-strong transition-all duration-300"
              asChild
            >
              <Link to="/signup">
                <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Get Started
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-card/50 backdrop-blur-sm border-2 hover:bg-card/80"
              asChild
            >
              <Link to="/signup">
                <Calendar className="w-5 h-5 mr-2" />
                Book a Test Now
              </Link>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-8 border-t border-border/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">100%</div>
              <div className="text-sm text-muted-foreground">Secure & Private</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-1">24/7</div>
              <div className="text-sm text-muted-foreground">Support Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-health mb-1">AI</div>
              <div className="text-sm text-muted-foreground">Report Analysis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow -z-10" />
    </section>
  );
};

export default Hero;
