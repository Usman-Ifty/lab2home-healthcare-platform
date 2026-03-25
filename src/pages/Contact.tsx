import { useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";
import { Phone, Mail, Send, MessageCircle, Loader2 } from "lucide-react";
import SplitText from "@/components/shared/SplitText";

// Schema (Kept for functionality)
const contactSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(5, "Subject should be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const Contact = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
    });

    const onSubmit = async (data: ContactFormValues) => {
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        console.log("Contact form submitted:", data);
        toast.success("Message sent successfully! We'll get back to you soon.");
        form.reset();
        setIsSubmitting(false);
    };

    const faqs = [
        {
            question: "How do I book a test?",
            answer: "You can book a test by signing up as a patient, selecting 'Book Test' from your dashboard, choosing a lab, and scheduling a time slot."
        },
        {
            question: "Is home collection free?",
            answer: "Home collection charges depend on the lab you choose. Some labs offer free collection above a certain amount."
        },
        {
            question: "When will I get my reports?",
            answer: "Most reports are available within 24 hours. You can view and download them directly from your dashboard."
        },
        {
            question: "Are the labs verified?",
            answer: "Yes, all labs on our platform undergo a strict verification process including license checks."
        }
    ];

    // ── Components for the Gradient Panel ──────────────────────────────────────
    const FloatingIcon = ({ icon: Icon, className }: { icon: React.ElementType, className?: string }) => (
        <div className={`absolute flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg ${className}`}>
            <Icon className="text-white/90" />
        </div>
    );

    const Blob = ({ className }: { className?: string }) => (
        <div className={`absolute rounded-full blur-3xl opacity-30 animate-blob ${className}`} />
    );

    interface InfoItemCardProps {
        icon: ReactNode;
        title: string;
        main: string;
        sub: string;
    }

    const InfoItemCard = ({ icon, title, main, sub }: InfoItemCardProps) => (
        <div className="flex items-start gap-4 p-4 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md shadow-soft hover:bg-white/20 transition-all duration-300">
            <div className="p-3 rounded-xl bg-white/20 text-white shadow-inner">
                {icon}
            </div>
            <div className="text-white">
                <p className="text-xs font-medium text-white/70 mb-0.5 uppercase tracking-wider">{title}</p>
                <h3 className="text-base font-bold">{main}</h3>
                <p className="text-sm text-white/80">{sub}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col pt-[72px]">
            <Navbar />

            <main className="flex-1 flex flex-col lg:flex-row">
                {/* ── LEFT: Gradient Panel (hidden on mobile) ──────────────────────── */}
                <div className="hidden lg:flex lg:w-1/2 auth-gradient-panel relative overflow-hidden items-center justify-center p-12">
                    {/* Background Blobs */}
                    <Blob className="top-20 left-10 w-64 h-64 bg-white" />
                    <Blob className="bottom-20 right-10 w-80 h-80 bg-blue-300 animation-delay-2000" />
                    <Blob className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-300 animation-delay-4000" />

                    {/* Floating Icons */}
                    <FloatingIcon icon={Phone} className="w-16 h-16 top-32 left-12 animate-bounce-gentle" />
                    <FloatingIcon icon={Mail} className="w-20 h-20 bottom-40 right-16 animate-pulse" />
                    <FloatingIcon icon={MessageCircle} className="w-14 h-14 top-1/2 left-20 animate-spin-slow" />

                    <div className="relative z-10 w-full max-w-md">
                        <div className="mb-6">
                            <SplitText
                                text="Get in Touch"
                                tag="h1"
                                className="text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight mb-4"
                                splitType="chars"
                                delay={40}
                                duration={0.8}
                                ease="power3.out"
                                from={{ opacity: 0, y: 30 }}
                                to={{ opacity: 1, y: 0 }}
                            />
                            <p className="text-white/80 text-lg">
                                We are happy to assist you 24/7. Reach out through any of these channels.
                            </p>
                        </div>

                        {/* Contact Info Pills inside the gradient */}
                        <div className="flex flex-col gap-4 mt-8 animate-fade-in-up anim-delay-300">
                            <InfoItemCard
                                icon={<Phone className="w-5 h-5" />}
                                title="Call Us"
                                main="0306-2221078"
                                sub="Mon-Sat, 9am - 6pm (PKT)"
                            />
                            <InfoItemCard
                                icon={<Mail className="w-5 h-5" />}
                                title="Email Support"
                                main="lab2home.help@gmail.com"
                                sub="For general inquiries"
                            />
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Form Panel ─────────────────────────────────────────────── */}
                <div className="flex-1 lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background relative overflow-hidden animate-slide-in-right">
                    {/* Subtle background circles */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <div className="w-full max-w-2xl relative z-10">
                        {/* Mobile Header (only shows on small screens) */}
                        <div className="lg:hidden mb-8 text-center animate-fade-in-up">
                            <h1 className="text-3xl font-bold text-foreground mb-2">Get in Touch</h1>
                            <p className="text-muted-foreground">We are happy to assist you 24/7.</p>
                        </div>

                        {/* Glass Form Card */}
                        <div className="glass-card rounded-2xl p-6 sm:p-8 animate-fade-in-up anim-delay-100 shadow-xl border border-border/40">
                            <h2 className="text-2xl font-bold mb-1">Send us a Message</h2>
                            <p className="text-muted-foreground mb-6 text-sm">Fill out the form below and we'll get back to you shortly.</p>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="grid sm:grid-cols-2 gap-5">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem className="animate-fade-in-up anim-delay-200">
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Muhammad Ahmad" className="auth-input h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem className="animate-fade-in-up anim-delay-300">
                                                    <FormLabel>Email Address</FormLabel>
                                                    <FormControl>
                                                        <Input type="email" placeholder="ahmad@example.com" className="auth-input h-11" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="subject"
                                        render={({ field }) => (
                                            <FormItem className="animate-fade-in-up anim-delay-400">
                                                <FormLabel>Subject</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Inquiry about lab tests or services" className="auth-input h-11" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="message"
                                        render={({ field }) => (
                                            <FormItem className="animate-fade-in-up anim-delay-500">
                                                <FormLabel>Message</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Type your detailed message here..."
                                                        className="min-h-[140px] resize-none auth-input"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="pt-2 animate-fade-in-up anim-delay-600">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full h-12 text-lg font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 group"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                                            ) : (
                                                <>
                                                    <Send className="w-5 h-5 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </div>

                        {/* FAQs Section nicely placed below the form */}
                        <div className="mt-8 pt-8 border-t border-border/50 animate-fade-in-up anim-delay-700">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-primary" />
                                Quick FAQs
                            </h3>
                            <Accordion type="single" collapsible className="w-full bg-card/60 backdrop-blur-sm rounded-xl border p-2">
                                {faqs.map((faq, i) => (
                                    <AccordionItem key={i} value={`item-${i}`} className="border-b-0">
                                        <AccordionTrigger className="text-left font-medium hover:no-underline text-sm py-3 px-3 rounded-lg hover:bg-muted/50 data-[state=open]:text-primary transition-all">
                                            {faq.question}
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground text-sm px-3 pb-3">
                                            {faq.answer}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Contact;