import { Button } from "@/components/ui/button";
import { ArrowRight, Phone, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Blob = ({ className }: { className?: string }) => (
    <div className={`absolute rounded-full blur-3xl opacity-40 animate-blob ${className}`} />
);

const CTA = () => {
  return (
    <section className="relative py-24 overflow-hidden auth-gradient-panel flex items-center justify-center">
      {/* Liquid background blobs */}
      <Blob className="top-0 left-1/4 w-96 h-96 bg-white mix-blend-overlay" />
      <Blob className="bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-400 mix-blend-overlay animation-delay-4000" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="glass-card bg-white/10 dark:bg-black/10 backdrop-blur-2xl border border-white/20 max-w-5xl mx-auto rounded-[3rem] p-8 md:p-16 lg:p-20 text-center shadow-2xl relative overflow-hidden"
        >
            {/* Inner subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                Ready to Experience <br className="hidden md:block"/> Healthcare at Home?
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join thousands of satisfied patients who trust Lab2Home for their diagnostic needs. 
                Book your first test today and experience the ultimate convenience.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center relative z-10">
                <Button 
                    size="lg" 
                    className="text-lg px-8 py-7 rounded-full bg-white text-primary hover:bg-white/90 shadow-strong hover:scale-105 transition-all duration-300 w-full sm:w-auto overflow-hidden group"
                    asChild
                >
                    <Link to="/signup" className="relative">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        <UserPlus className="w-5 h-5 mr-3" />
                        <span className="font-bold relative z-10">Sign Up Now</span>
                        <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform relative z-10" />
                    </Link>
                </Button>
                <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-7 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary transition-all duration-300 w-full sm:w-auto shadow-soft"
                    asChild
                >
                    <Link to="/contact">
                        <Phone className="w-5 h-5 mr-3" />
                        Contact Support
                    </Link>
                </Button>
            </div>

            <div className="mt-16 pt-12 border-t border-white/20">
                <p className="text-white/80 text-sm mb-6 uppercase tracking-widest font-semibold">Trusted by leading healthcare providers</p>
                <div className="flex justify-center items-center gap-8 md:gap-16 flex-wrap opacity-70">
                    <div className="text-white font-black text-xl tracking-tight">CERTIFIED</div>
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                    <div className="text-white font-black text-xl tracking-tight">SECURE</div>
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                    <div className="text-white font-black text-xl tracking-tight">RELIABLE</div>
                </div>
            </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
