import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const TermsConditions = () => {
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
                                <FileText className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-bold">Terms and Conditions</CardTitle>
                            <p className="text-muted-foreground">Last updated: February 13, 2026</p>
                        </CardHeader>
                        <CardContent className="prose prose-blue dark:prose-invert max-w-none space-y-8">
                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">1. Acceptance of Terms</h2>
                                <p>
                                    By accessing and using Lab2Home, you agree to be bound by these Terms and Conditions. If you do not agree, please refrain from using our services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">2. Service Description</h2>
                                <p>
                                    Lab2Home provides a platform to facilitate diagnostic test bookings, home sample collections, and marketplace purchases of healthcare products. We partner with certified laboratories and phlebotomists.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">3. User Responsibilities</h2>
                                <p>Users must:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li>Provide accurate personal and medical information.</li>
                                    <li>Be present at the collection address during the scheduled time slot.</li>
                                    <li>Ensure valid prescriptions are provided where required by law.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">4. Medical Disclaimer</h2>
                                <p>
                                    Lab2Home is a service facilitator. The accuracy of test results is the responsibility of the participating laboratory. Our AI interpretations are for informational purposes only and should never replace professional medical advice.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">5. Limitation of Liability</h2>
                                <p>
                                    Lab2Home shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our diagnostic services.
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default TermsConditions;
