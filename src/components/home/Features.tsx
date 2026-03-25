import { Home, Brain, FileText, ShoppingBag, MessageSquare, Bell } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Home,
    title: "Home Collection",
    description: "Professional phlebotomists visit your home at your convenience for safe sample collection.",
    color: "text-primary",
    bgColor: "from-primary/20 to-primary/5",
    borderColor: "group-hover:border-primary/50",
  },
  {
    icon: Brain,
    title: "AI Interpretation",
    description: "Get your lab reports explained in simple, patient-friendly language using advanced AI.",
    color: "text-secondary",
    bgColor: "from-secondary/20 to-secondary/5",
    borderColor: "group-hover:border-secondary/50",
  },
  {
    icon: FileText,
    title: "Real-Time Tracking",
    description: "Monitor your test progress from sample collection to result delivery in real-time.",
    color: "text-health",
    bgColor: "from-health/20 to-health/5",
    borderColor: "group-hover:border-health/50",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description: "Access to Vital Track Store for essential medical monitoring devices and equipment.",
    color: "text-primary",
    bgColor: "from-primary/20 to-primary/5",
    borderColor: "group-hover:border-primary/50",
  },
  {
    icon: MessageSquare,
    title: "Direct Chat",
    description: "Stay connected with labs and phlebotomists through our secure integrated messaging system.",
    color: "text-secondary",
    bgColor: "from-secondary/20 to-secondary/5",
    borderColor: "group-hover:border-secondary/50",
  },
  {
    icon: Bell,
    title: "Smart Alerts",
    description: "Receive timely push notifications about your appointments, test status, and results.",
    color: "text-health",
    bgColor: "from-health/20 to-health/5",
    borderColor: "group-hover:border-health/50",
  },
];

const Features = () => {
  return (
    <section className="relative py-32 bg-muted/30 overflow-hidden border-y border-border/50">
      {/* Background Ambience */}
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-bold tracking-wide uppercase mb-4">
            Features
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            Comprehensive <span className="text-secondary">Solutions</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everything you need for convenient, reliable, and highly accessible diagnostic services tailored to modern patient needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`group glass-card p-8 rounded-3xl bg-card/50 backdrop-blur-md border border-border/60 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ${feature.borderColor}`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                <feature.icon className={`w-7 h-7 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-[15px]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
