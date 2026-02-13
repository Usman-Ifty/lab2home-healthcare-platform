import { useState, ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import Footer from "@/components/shared/Footer";
import CardNav from "@/components/home/CardNav";
// import Squares from "@/components/home/Squares"; // Removed the Squares component
import { publicNavItems } from "@/config/public-nav";
import logo from "/logo.svg";
import { Phone, Mail, MapPin, Send, MessageCircle, Loader2, X } from "lucide-react"; // Added X for the mock close button
import SplitText from "@/components/shared/SplitText";

// --- Configuration for Visual Style ---
// Define a very light background for the Soft UI look
const SOFT_BG = "bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-blue-950";
const SOFT_SHADOW = "shadow-2xl shadow-blue-200/50 dark:shadow-blue-900/40";
const SOFT_HOVER = "hover:shadow-3xl hover:shadow-blue-300/60 transition-all duration-300";


// Schema (Kept for functionality)
const contactSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    subject: z.string().min(5, "Subject should be at least 5 characters"),
    message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

// Framer Motion Variants (Adjusted for smoother, larger entrance)
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

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

    interface SoftCardProps {
        children: ReactNode;
        delay?: number;
        title: string;
        className?: string;
    }

    // Card component enhanced with Soft UI styling and motion
    const SoftCard = ({ children, delay = 0, title, className = "" }: SoftCardProps) => (
        <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.4 + delay, duration: 0.7 }}
            // Apply the Soft UI shadow and hover effect
            className={`${SOFT_SHADOW} ${SOFT_HOVER} rounded-xl ${className}`}
        >
            <Card className="rounded-xl border-none bg-card/90 backdrop-blur-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border/50">
                    <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                    <motion.div whileHover={{ rotate: 90 }} className="text-muted-foreground cursor-pointer">
                        {/* Mock Close/Expand Button based on image */}
                        <X className="w-4 h-4" />
                    </motion.div>
                </CardHeader>
                <CardContent className="p-4">
                    {children}
                </CardContent>
            </Card>
        </motion.div>
    );

    interface InfoItemCardProps {
        icon: ReactNode;
        title: string;
        main: string;
        sub: string;
        iconColor: string;
        delay?: number;
    }

    // Minimal Card for internal elements like contact details
    const InfoItemCard = ({ icon, title, main, sub, iconColor, delay = 0 }: InfoItemCardProps) => (
        <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.4 + delay, duration: 0.7 }}
            className={`flex items-start gap-4 p-4 rounded-lg border bg-background/50 ${SOFT_HOVER}`} // Lighter lift on internal items
        >
            <div className={`p-3 rounded-xl shadow-md ${iconColor}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
                <h3 className="text-md font-bold text-foreground">{main}</h3>
                <p className="text-sm text-muted-foreground">{sub}</p>
            </div>
        </motion.div>
    );


    return (
        <div className={`min-h-screen flex flex-col relative ${SOFT_BG} overflow-x-hidden`}>
            {/* Navigation (Keep as is, adjusted color if needed) */}
            <CardNav
                logo={logo}
                logoAlt="Lab2Home Logo"
                items={publicNavItems}
                baseColor="#fff"
                menuColor="hsl(200 85% 45%)"
            />

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-16 px-4 text-center">
                <div className="container mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-3xl mx-auto"
                    >
                        <div className="mb-6">
                            <SplitText
                                text="Get in Touch"
                                tag="h1"
                                className="text-5xl md:text-7xl font-extrabold text-foreground leading-snug"
                                splitType="chars"
                                delay={50}
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
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto"
                        >
                            We are happy to assist you 24/7.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="relative z-10 py-16 px-4 flex-1">
                <div className="container mx-auto max-w-7xl">
                    <motion.div
                        className="grid lg:grid-cols-3 gap-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                    >

                        {/* Column 1: Contact Details & FAQ (Split for SoftCard) */}
                        <div className="lg:col-span-1 space-y-8">
                            <SoftCard title="Contact Details" delay={0.1}>
                                <div className="space-y-4">
                                    <InfoItemCard
                                        icon={<Phone className="w-5 h-5" />}
                                        iconColor="bg-primary text-primary-foreground"
                                        title="Call Us"
                                        main="0306-2221078"
                                        sub="Mon-Sat, 9am - 6pm (PKT)"
                                        delay={0.2}
                                    />
                                    <InfoItemCard
                                        icon={<Mail className="w-5 h-5" />}
                                        iconColor="bg-secondary text-secondary-foreground"
                                        title="Email Support"
                                        main="labhome.help@gmail.com"
                                        sub="For general inquiries"
                                        delay={0.3}
                                    />
                                    <InfoItemCard
                                        icon={<MapPin className="w-5 h-5" />}
                                        iconColor="bg-blue-500 text-white"
                                        title="Office Address"
                                        main="Office 24, Blue Area"
                                        sub="Islamabad, Pakistan"
                                        delay={0.4}
                                    />

                                </div>
                            </SoftCard>

                            {/* FAQ Section Card */}
                            <SoftCard title="Quick FAQs" delay={0.5}>
                                <Accordion type="single" collapsible className="w-full">
                                    {faqs.map((faq, i) => (
                                        <AccordionItem key={i} value={`item-${i}`}>
                                            <AccordionTrigger className="text-left font-semibold hover:no-underline text-base py-3">
                                                {faq.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="text-muted-foreground text-sm">
                                                {faq.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </SoftCard>
                        </div>

                        {/* Column 2 (Spanning 2 columns for the large form) */}
                        <div className="lg:col-span-2">
                            <SoftCard title="Send us a Message" delay={0.1} className="min-h-full h-full">
                                <CardDescription className="mb-6">Fill out the form below and we'll get back to you shortly.</CardDescription>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Muhammad Ahmad" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Email Address</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="ahmad@example.com" {...field} />
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
                                                <FormItem>
                                                    <FormLabel>Subject</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Inquiry about lab tests or services" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="message"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Message</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Type your detailed message here..."
                                                            className="min-h-[180px] resize-none"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Button with Soft UI styling and motion */}
                                        <motion.div whileTap={{ scale: 0.98 }}>
                                            <Button
                                                type="submit"
                                                size="lg"
                                                // Make the button full width to maximize soft shadow presence
                                                className="w-full h-12 text-lg font-semibold rounded-lg"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5 mr-2" />
                                                        Send Message
                                                    </>
                                                )}
                                            </Button>
                                        </motion.div>
                                    </form>
                                </Form>
                            </SoftCard>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Contact;