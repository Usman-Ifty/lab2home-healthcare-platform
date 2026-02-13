import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
    return (
        <DashboardLayout role="patient">
            <div className="container mx-auto py-12 px-4 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="shadow-lg border-primary/10">
                        <CardHeader className="text-center space-y-4">
                            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
                            <p className="text-muted-foreground">Last updated: February 13, 2026</p>
                        </CardHeader>
                        <CardContent className="prose prose-blue dark:prose-invert max-w-none space-y-8">
                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">1. Introduction</h2>
                                <p>
                                    At Lab2Home, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform and use our diagnostic services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">2. Information We Collect</h2>
                                <p>We collect information that you provide directly to us, including:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Personal Information:</strong> Name, email address, phone number, date of birth, and home address for sample collection.</li>
                                    <li><strong>Health Information:</strong> Test prescriptions, diagnostic reports, and relevant medical history necessary for interpretation.</li>
                                    <li><strong>Payment Information:</strong> Transaction details when you book a test or purchase products (processed securely via PayFast).</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">3. How We Use Your Information</h2>
                                <p>We use the collected data for various purposes:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>To provide and maintain our Service, including scheduling home collections.</li>
                                    <li>To notify you about changes to our Service or your test results.</li>
                                    <li>To process your payments and prevent fraudulent transactions.</li>
                                    <li>To provide customer support and improve our platform experience.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">4. Data Security</h2>
                                <p>
                                    As a healthcare platform, we implement the highest security standards to protect your sensitive data. All reports are encrypted, and access is restricted to authorized labs and the patient only.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">5. Contact Us</h2>
                                <p>
                                    If you have any questions about this Privacy Policy, please contact us at:
                                    <br />
                                    Email: lab2home.help@gmail.com
                                    <br />
                                    Address: Office 24, Blue Area, Islamabad, Pakistan
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default PrivacyPolicy;
