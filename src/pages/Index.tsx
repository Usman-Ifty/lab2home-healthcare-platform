import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import Services from "@/components/home/Services";
import CTA from "@/components/home/CTA";
import Footer from "@/components/shared/Footer";

const Index = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace("#", ""));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [hash]);

  return (
    <div className="min-h-screen">
      <Hero />
      <div id="features"><Features /></div>
      <div id="how-it-works"><HowItWorks /></div>
      <div id="services"><Services /></div>
      <CTA />
      <div id="footer"><Footer /></div>
    </div>
  );
};

export default Index;
