import { Button } from "@/components/ui/button";
import { Calendar, Sparkles, UserPlus, HeartPulse, Activity, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/shared/Navbar";
import SplitText from "@/components/shared/SplitText";
import { useAuth } from "@/contexts/AuthContext";

// ── Shared Premium Components ──────────────────────────────────────────────
const FloatingIcon = ({ icon: Icon, className }: { icon: React.ElementType, className?: string }) => (
    <div className={`absolute flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg ${className}`}>
        <Icon className="text-white/90" />
    </div>
);

const Blob = ({ className }: { className?: string }) => (
    <div className={`absolute rounded-full blur-3xl opacity-30 animate-blob ${className}`} />
);

const Hero = () => {
    const { isAuthenticated, user } = useAuth();
    
    return (
        <section className="relative min-h-[95vh] w-full flex items-center justify-center overflow-hidden pt-24 pb-20 auth-gradient-panel">
            <Navbar />

            {/* Background Blobs for Hero */}
            <Blob className="top-10 left-10 w-72 h-72 bg-white" />
            <Blob className="bottom-0 right-10 w-[26rem] h-[26rem] bg-blue-300 animation-delay-2000" />
            <Blob className="top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-purple-300 animation-delay-4000" />

            {/* Floating Aesthetic Icons */}
            <FloatingIcon icon={HeartPulse} className="w-14 h-14 top-32 left-1/4 animate-bounce-gentle hidden lg:flex" />
            <FloatingIcon icon={Sparkles} className="w-12 h-12 bottom-32 right-1/4 animate-pulse hidden lg:flex" />
            <FloatingIcon icon={Activity} className="w-16 h-16 top-1/2 right-20 animate-spin-slow hidden xl:flex" />

            <div className="relative z-10 container mx-auto px-4 pointer-events-none">
                <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8 shadow-soft"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span>AI-Powered Healthcare at Home</span>
                    </motion.div>

                    {/* Main Heading */}
                    <div className="mb-6">
                        <SplitText
                            text="Lab at your Doorstep"
                            tag="h1"
                            className="text-5xl md:text-6xl lg:text-7xl xl:text-[5rem] font-extrabold text-white leading-[1.1] tracking-tight"
                            splitType="chars"
                            delay={30}
                            duration={0.8}
                            ease="power3.out"
                            from={{ opacity: 0, y: 50 }}
                            to={{ opacity: 1, y: 0 }}
                            threshold={0.3}
                            rootMargin="0px"
                        />
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="text-xl md:text-2xl text-white/90 mb-4 font-medium"
                    >
                        Care at Your Fingertips
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0, duration: 0.6 }}
                        className="text-lg text-white/80 mb-12 max-w-2xl mx-auto text-balance leading-relaxed"
                    >
                        Book home blood sample collection, track your tests in real-time, and get AI-powered
                        interpretation of your lab reports—all from the comfort of your home.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 pointer-events-auto"
                    >
                        {isAuthenticated ? (
                            <>
                                <Button
                                    size="lg"
                                    className="group text-lg px-8 py-6 rounded-full shadow-strong hover:shadow-2xl hover:scale-105 transition-all duration-300"
                                    asChild
                                >
                                    <Link to={`/${user?.role || ''}`}>
                                        <Activity className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                        Go to Dashboard
                                    </Link>
                                </Button>
                                {user?.role === 'patient' && (
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="text-lg px-8 py-6 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary transition-all duration-300 shadow-soft"
                                        asChild
                                    >
                                        <Link to="/patient/book-test">
                                            <Calendar className="w-5 h-5 mr-2" />
                                            Book a Test Now
                                        </Link>
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                <Button
                                    size="lg"
                                    className="group text-lg px-8 py-6 rounded-full shadow-strong hover:shadow-2xl hover:scale-105 transition-all duration-300"
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
                                    className="text-lg px-8 py-6 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary transition-all duration-300 shadow-soft"
                                    asChild
                                >
                                    <Link to="/signup">
                                        <Calendar className="w-5 h-5 mr-2" />
                                        Book a Test Now
                                    </Link>
                                </Button>
                            </>
                        )}
                    </motion.div>

                    {/* Trust Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, duration: 0.6 }}
                        className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto pt-6"
                    >
                        <div className="glass-card bg-white/10 border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center pointer-events-auto hover:bg-white/20 transition-colors">
                            <ShieldCheck className="w-8 h-8 text-white mb-2" />
                            <div className="text-2xl font-black text-white mb-1">100%</div>
                            <div className="text-xs font-medium uppercase tracking-wider text-white/80">Secure & Private</div>
                        </div>
                        <div className="glass-card bg-white/10 border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center pointer-events-auto hover:bg-white/20 transition-colors">
                            <Activity className="w-8 h-8 text-white mb-2" />
                            <div className="text-2xl font-black text-white mb-1">24/7</div>
                            <div className="text-xs font-medium uppercase tracking-wider text-white/80">Support Available</div>
                        </div>
                        <div className="glass-card bg-white/10 border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center pointer-events-auto hover:bg-white/20 transition-colors">
                            <Sparkles className="w-8 h-8 text-white mb-2" />
                            <div className="text-2xl font-black text-white mb-1">AI</div>
                            <div className="text-xs font-medium uppercase tracking-wider text-white/80">Report Analysis</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
