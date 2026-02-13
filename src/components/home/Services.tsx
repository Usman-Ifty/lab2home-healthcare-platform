import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestTube, Users, Package, ArrowRight } from "lucide-react";

const services = [
  {
    icon: TestTube,
    title: "Diagnostic Tests",
    description: "Comprehensive range of blood tests including CBC, lipid profile, thyroid function, diabetes screening, and specialized diagnostic panels.",
    features: ["Home Collection", "Fast Results", "Certified Labs"],
    color: "primary",
  },
  {
    icon: Users,
    title: "AI Report Interpretation",
    description: "Get your lab reports explained in simple, patient-friendly language using advanced AI technology. Understand your health data better.",
    features: ["AI-Powered Analysis", "Simple Language", "Instant Results"],
    color: "secondary",
  },
  {
    icon: Package,
    title: "Vital Track Store",
    description: "Shop for essential medical supplies including thermometers, blood pressure monitors, glucometers, and other health monitoring devices.",
    features: ["Quality Products", "Fast Delivery", "Secure Payment"],
    color: "health",
  },
];

const Services = () => {
  return (
    <section className="py-24 bg-gradient-soft">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete healthcare ecosystem designed for your convenience and peace of mind
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <Card
              key={index}
              className="group p-8 hover:shadow-strong transition-all duration-300 bg-card/80 backdrop-blur-sm border-border/50 flex flex-col"
            >
              <div className={`w-16 h-16 rounded-2xl bg-${service.color}/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className={`w-8 h-8 text-${service.color}`} />
              </div>
              
              <h3 className="text-2xl font-bold text-foreground mb-4">
                {service.title}
              </h3>
              
              <p className="text-muted-foreground mb-6 leading-relaxed flex-grow">
                {service.description}
              </p>

              <div className="space-y-2 mb-6">
                {service.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className={`w-1.5 h-1.5 rounded-full bg-${service.color}`} />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                Learn More
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
