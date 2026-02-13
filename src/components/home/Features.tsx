import { Card } from "@/components/ui/card";
import { Home, Brain, FileText, ShoppingBag, MessageSquare, Bell } from "lucide-react";

const features = [
  {
    icon: Home,
    title: "Home Sample Collection",
    description: "Professional phlebotomists visit your home at your convenience for blood sample collection.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Brain,
    title: "AI Report Interpretation",
    description: "Get your lab reports explained in simple, patient-friendly language using advanced AI.",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: FileText,
    title: "Real-Time Tracking",
    description: "Monitor your test progress from sample collection to result delivery in real-time.",
    color: "text-health",
    bgColor: "bg-health/10",
  },
  {
    icon: ShoppingBag,
    title: "Medical Marketplace",
    description: "Access to Vital Track Marketplace for thermometers, BP monitors, glucometers, and more.",
    color: "text-primary-light",
    bgColor: "bg-primary/10",
  },
  {
    icon: MessageSquare,
    title: "Direct Communication",
    description: "Stay connected with labs and phlebotomists through our integrated messaging system.",
    color: "text-secondary-light",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Receive timely updates about your appointments, test status, and results.",
    color: "text-health-light",
    bgColor: "bg-health/10",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Comprehensive Healthcare Solutions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need for convenient, reliable, and accessible diagnostic services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group p-8 hover:shadow-strong transition-all duration-300 hover:-translate-y-2 bg-card/80 backdrop-blur-sm border-border/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
