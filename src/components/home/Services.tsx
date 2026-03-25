import { Button } from "@/components/ui/button";
import { TestTube, Users, Package, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  {
    icon: TestTube,
    title: "Diagnostic Tests",
    description: "Comprehensive range of blood tests including CBC, lipid profile, thyroid function, diabetes screening, and specialized diagnostic panels.",
    features: ["Home Collection", "Fast Results", "Certified Labs"],
    color: "primary",
    bgColor: "from-primary/20 to-primary/5",
  },
  {
    icon: Users,
    title: "AI Report Interpretation",
    description: "Get your lab reports explained in simple, patient-friendly language using advanced AI technology. Understand your health data better.",
    features: ["AI-Powered Analysis", "Simple Language", "Instant Results"],
    color: "secondary",
    bgColor: "from-secondary/20 to-secondary/5",
  },
  {
    icon: Package,
    title: "Vital Track Store",
    description: "Shop for essential medical supplies including thermometers, blood pressure monitors, glucometers, and other health monitoring devices.",
    features: ["Quality Products", "Fast Delivery", "Secure Payment"],
    color: "health",
    bgColor: "from-health/20 to-health/5",
  },
];

const Services = () => {
  return (
    <section className="relative py-32 bg-background overflow-hidden">
      {/* Subtle background ambient blob */}
      <div className="absolute top-1/2 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 tracking-tight">
            Our <span className="text-primary">Services</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A complete healthcare ecosystem designed for your convenience, providing everything you need in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
               <div className="group glass-card p-8 rounded-3xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-card/60 backdrop-blur-xl border border-border/50 h-full flex flex-col relative overflow-hidden">
                  {/* Hover Glow inside Card */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl -z-10`} />

                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.bgColor} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-inner border border-white/10`}>
                    <service.icon className={`w-8 h-8 text-${service.color}`} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {service.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-8 leading-relaxed flex-grow text-[15px]">
                    {service.description}
                  </p>

                  <div className="space-y-3 mb-8">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm font-medium">
                        <div className={`w-2 h-2 rounded-full bg-${service.color} shadow-[0_0_8px_rgba(0,0,0,0.2)] shadow-${service.color}/50`} />
                        <span className="text-foreground/80 group-hover:text-foreground transition-colors">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl h-12 text-base font-semibold border-border/60 bg-transparent group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                  >
                    Learn More
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
               </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
