import { Calendar, Home, FlaskConical, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Calendar,
    title: "Book Your Test",
    description: "Select your desired test and choose a convenient time slot through our easy-to-use platform.",
    step: "01",
    color: "primary",
  },
  {
    icon: Home,
    title: "Sample Collection",
    description: "A certified phlebotomist visits your home to collect blood samples safely and professionally.",
    step: "02",
    color: "secondary",
  },
  {
    icon: FlaskConical,
    title: "Lab Processing",
    description: "Your samples are processed at our partner laboratories with real-time status updates.",
    step: "03",
    color: "primary",
  },
  {
    icon: FileCheck,
    title: "Receive Results",
    description: "Get your reports with AI-powered interpretation explaining results in simple, clear language.",
    step: "04",
    color: "health",
  },
];

const HowItWorks = () => {
  return (
    <section className="relative py-32 bg-background overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-0 left-1/2 w-full max-w-5xl h-[500px] bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -top-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 tracking-tight">
            How It <span className="text-primary">Works</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Four simple, frictionless steps to complete healthcare diagnostics right from the comfort of your living room.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 relative">
            {/* Animated Connection Line for Desktop */}
            <div className="hidden lg:block absolute top-[4.5rem] left-[12.5%] right-[12.5%] h-1 bg-muted rounded-full overflow-hidden">
                <motion.div 
                   className="h-full bg-gradient-to-r from-primary via-secondary to-health w-full origin-left"
                   initial={{ scaleX: 0 }}
                   whileInView={{ scaleX: 1 }}
                   viewport={{ once: true, margin: "-100px" }}
                   transition={{ duration: 1.5, ease: "easeInOut" }}
                />
            </div>

            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.2 + 0.3, duration: 0.6 }}
                className="relative text-center group"
              >
                {/* Step Number Circle */}
                <div className="relative inline-flex items-center justify-center mb-8">
                  {/* Outer pulse glow */}
                  <div className={`absolute w-32 h-32 rounded-full bg-${step.color}/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-500 blur-xl`} />
                  
                  {/* Glass Orb */}
                  <div className="glass-card relative w-24 h-24 rounded-full bg-card/80 border-4 border-background flex items-center justify-center shadow-xl z-10 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all duration-300">
                    <step.icon className={`w-10 h-10 text-${step.color} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  
                  {/* Step Badge */}
                  <div className={`absolute -top-2 -right-2 w-10 h-10 rounded-full bg-${step.color} text-white flex items-center justify-center text-sm font-black shadow-strong z-20`}>
                    {step.step}
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed px-2">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
