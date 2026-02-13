import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "react-router-dom";
import Footer from "@/components/shared/Footer";
import CardNav from "@/components/home/CardNav";
import Squares from "@/components/home/Squares";
import { publicNavItems } from "@/config/public-nav";
import logo from "/logo.svg";
import { Users, Heart, Award, Sparkles, ArrowRight } from "lucide-react";

const About = () => {
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const element = document.getElementById(location.hash.slice(1));
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth' });
                }, 100); // Small delay to ensure rendering
            }
        }
    }, [location]);

    return (
        <div className="min-h-screen flex flex-col relative">
            <CardNav
                logo={logo}
                logoAlt="Lab2Home Logo"
                items={publicNavItems}
                baseColor="#fff"
                menuColor="hsl(200 85% 45%)"
            />


            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-30">
                    <Squares speed={0.5} squareSize={40} direction="diagonal" />
                </div>
                <div className="container mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4" />
                            Revolutionizing Healthcare
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-6 leading-tight">
                            Bringing the Lab to Your Living Room
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8 text-balance">
                            We're on a mission to make diagnostic healthcare accessible, affordable, and comfortable for everyone in Pakistan.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative z-10 py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { label: "Happy Patients", value: "10,000+", icon: Heart },
                            { label: "Partner Labs", value: "50+", icon: Award },
                            { label: "Expert Phlebotomists", value: "200+", icon: Users },
                            { label: "Cities Covered", value: "12", icon: Sparkles },
                        ].map((stat, index) => (
                            <div
                                key={index}
                                className="text-center"
                            >
                                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="relative z-10 py-20 px-4">
                <div className="container mx-auto max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
                            <p className="text-lg text-muted-foreground mb-6">
                                Lab2Home was founded with a simple yet powerful idea: healthcare shouldn't be a hassle. We bridge the gap between patients and diagnostic labs by providing a seamless, digital-first experience.
                            </p>
                            <p className="text-lg text-muted-foreground mb-8">
                                From booking a test to receiving AI-analyzed reports, we ensure accuracy, privacy, and speed every step of the way.
                            </p>
                            <Button size="lg" asChild>
                                <Link to="/signup">
                                    Join Our Network <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl -z-10" />
                            <img
                                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070"
                                alt="Medical Team"
                                className="rounded-3xl shadow-xl border border-border/50"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section Placeholder */}
            <section id="team" className="relative z-10 py-20 bg-muted/30">
                <div className="container mx-auto px-4 text-center">
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold mb-4">Meet the Minds Behind Lab2Home</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            A dedicated team of developers, doctors, and logistics experts working together to improve your health journey.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { name: "Muhammad Usman Awan", role: "Co-Founder & Developer" },
                            { name: "Faizan Ahmad", role: "Co-Founder & Developer" },
                            { name: "Muhammad Ahmad", role: "Co-Founder & Developer" },
                        ].map((member, i) => (
                            <Card key={i} className="bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                                <CardContent className="pt-8 pb-8">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full mb-6 flex items-center justify-center text-2xl font-bold text-primary">
                                        {member.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{member.name}</h3>
                                    <p className="text-primary font-medium mb-4">{member.role}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default About;
