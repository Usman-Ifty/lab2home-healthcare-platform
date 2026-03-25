import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Users, Heart, Award, Sparkles, ArrowRight, ShieldCheck, Activity } from "lucide-react";
import SplitText from "@/components/shared/SplitText";

// ── Shared Premium Components ──────────────────────────────────────────────
const FloatingIcon = ({ icon: Icon, className }: { icon: React.ElementType, className?: string }) => (
    <div className={`absolute flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg ${className}`}>
        <Icon className="text-white/90" />
    </div>
);

const Blob = ({ className }: { className?: string }) => (
    <div className={`absolute rounded-full blur-3xl opacity-30 animate-blob ${className}`} />
);

const About = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const element = document.getElementById(location.hash.slice(1));
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            }
        }
    }, [location]);

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            <Navbar />

            {/* ── Premium Hero Section ────────────────────────────────────────────── */}
            <section className="relative w-full pt-32 pb-24 lg:pt-40 lg:pb-32 px-4 auth-gradient-panel overflow-hidden">
                {/* Background Blobs for Hero */}
                <Blob className="top-10 left-10 w-64 h-64 bg-white" />
                <Blob className="bottom-0 right-20 w-96 h-96 bg-blue-300 animation-delay-2000" />
                <Blob className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300 animation-delay-4000" />

                {/* Floating Aesthetic Icons */}
                <FloatingIcon icon={Sparkles} className="w-12 h-12 top-24 right-1/4 animate-bounce-gentle" />
                <FloatingIcon icon={Heart} className="w-16 h-16 bottom-24 left-1/4 animate-pulse" />
                <FloatingIcon icon={Activity} className="w-14 h-14 top-1/3 left-12 animate-spin-slow hidden md:flex" />

                <div className="container mx-auto text-center relative z-10 max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium mb-8 shadow-soft"
                    >
                        <Sparkles className="w-4 h-4" />
                        Revolutionizing Healthcare
                    </motion.div>
                    
                    <div className="mb-6">
                        <SplitText
                            text="Bringing the Lab to Your Living Room"
                            tag="h1"
                            className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight px-4"
                            splitType="chars"
                            delay={30}
                            duration={0.7}
                            ease="power3.out"
                            from={{ opacity: 0, y: 40 }}
                            to={{ opacity: 1, y: 0 }}
                        />
                    </div>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2, duration: 0.6 }}
                        className="text-xl md:text-2xl text-white/90 mb-10 text-balance mx-auto max-w-3xl font-medium"
                    >
                        We're on a mission to make diagnostic healthcare completely accessible, affordable, and comfortable for everyone in Pakistan.
                    </motion.p>
                </div>
            </section>

            {/* ── Overlapping Floating Stats Section ────────────────────────────── */}
            <section className="relative z-20 -mt-16 sm:-mt-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {[
                            { label: "Happy Patients", value: "10,000+", icon: Heart },
                            { label: "Partner Labs", value: "50+", icon: Award },
                            { label: "Expert Phlebotomists", value: "200+", icon: Users },
                            { label: "Cities Covered", value: "12", icon: ShieldCheck },
                        ].map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: index * 0.1 + 0.5, duration: 0.6 }}
                                className="glass-card rounded-2xl p-6 text-center shadow-xl border border-border/40 group hover:-translate-y-2 transition-transform duration-300"
                            >
                                <div className="w-14 h-14 mx-auto bg-primary/10 group-hover:bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-4 transition-colors">
                                    <stat.icon className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <h3 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1 tracking-tight">{stat.value}</h3>
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Mission Split Section ─────────────────────────────────────────── */}
            <section className="relative z-10 py-24 px-4 bg-background">
                {/* Subtle soft background blur */}
                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="container mx-auto max-w-6xl relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -40 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6 lg:pr-8"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-bold tracking-wide uppercase">
                                Our Purpose
                            </div>
                            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-foreground">
                                Seamless diagnostics <span className="text-primary">at your doorstep.</span>
                            </h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Lab2Home was founded with a simple yet powerful idea: healthcare shouldn't be a hassle. We bridge the critical gap between patients and diagnostic labs by providing an ultra-convenient, digital-first experience.
                            </p>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                From booking a test online to a painless home sample collection, and receiving AI-analyzed digital reports, we ensure <strong>accuracy</strong>, <strong>privacy</strong>, and <strong>speed</strong> every step of the way.
                            </p>
                            <div className="pt-4">
                                <Button size="lg" asChild className="rounded-full px-8 shadow-medium hover:shadow-strong transition-all group h-14 text-base">
                                    <Link to="/signup">
                                        Join Our Network <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-[2.5rem] blur-2xl -z-10 translate-y-4 translate-x-4" />
                            <div className="glass-card p-3 rounded-[2.5rem] bg-white/40 dark:bg-card/40 border border-white/50 shadow-2xl">
                                <img
                                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070"
                                    alt="Medical Team"
                                    className="rounded-[2rem] object-cover w-full h-full aspect-[4/3] shadow-inner"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Premium Team Section ──────────────────────────────────────────── */}
            <section id="team" className="relative z-10 py-24 bg-muted/30 border-t border-border/50 overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />

                <div className="container mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        className="mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Meet the Minds <span className="text-primary">Behind It</span></h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            A highly dedicated team of visionary developers, doctors, and logistics experts working together natively to revolutionize your health journey.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { name: "Muhammad Usman Awan", role: "Co-Founder & Lead Developer" },
                            { name: "Faizan Ahmad", role: "Co-Founder & Operations" },
                            { name: "Muhammad Ahmad", role: "Co-Founder & Architecture" },
                        ].map((member, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: i * 0.15 }}
                                className="group relative"
                            >
                                {/* Animated Glow Behind Card */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                
                                <div className="glass-card relative bg-card/60 rounded-3xl p-8 border border-border/50 shadow-lg hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30 transition-all duration-300 h-full flex flex-col items-center justify-center">
                                    <div className="w-28 h-28 bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 rounded-full mb-6 flex items-center justify-center text-3xl font-extrabold text-primary shadow-inner border border-primary/10 group-hover:border-primary/30 transition-all duration-500">
                                        {member.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-foreground">{member.name}</h3>
                                    <p className="text-primary/80 font-semibold uppercase tracking-wider text-sm">{member.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
