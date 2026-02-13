import { Calendar, Home, FlaskConical, FileCheck } from "lucide-react";

const steps = [
  {
    icon: Calendar,
    title: "Book Your Test",
    description: "Select your desired test and choose a convenient time slot through our easy-to-use platform.",
    step: "01",
  },
  {
    icon: Home,
    title: "Sample Collection",
    description: "A certified phlebotomist visits your home to collect blood samples safely and professionally.",
    step: "02",
  },
  {
    icon: FlaskConical,
    title: "Lab Processing",
    description: "Your samples are processed at our partner laboratories with real-time status updates.",
    step: "03",
  },
  {
    icon: FileCheck,
    title: "Receive Results",
    description: "Get your reports with AI-powered interpretation explaining results in simple language.",
    step: "04",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to complete healthcare from the comfort of your home
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection Line for Desktop */}
            <div className="hidden lg:block absolute top-20 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary via-secondary to-health" />

            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Step Number Circle */}
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="absolute w-24 h-24 rounded-full bg-gradient-primary opacity-20 animate-pulse-glow" />
                  <div className="relative w-20 h-20 rounded-full bg-card border-4 border-primary flex items-center justify-center shadow-medium z-10">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shadow-soft z-20">
                    {step.step}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
