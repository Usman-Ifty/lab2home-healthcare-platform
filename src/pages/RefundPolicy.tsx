import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

const RefundPolicy = () => {
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
                                <RefreshCw className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-bold">Return and Refund Policy</CardTitle>
                            <p className="text-muted-foreground">Last updated: February 13, 2026</p>
                        </CardHeader>
                        <CardContent className="prose prose-blue dark:prose-invert max-w-none space-y-8">
                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">1. Lab Test Cancellations</h2>
                                <p>
                                    We understand that plans can change. You can cancel your lab test booking under the following conditions:
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Full Refund:</strong> If cancelled at least 24 hours before the scheduled collection time.</li>
                                    <li><strong>Partial Refund (75%):</strong> If cancelled between 4 to 24 hours before the scheduled time.</li>
                                    <li><strong>No Refund:</strong> If the phlebotomist has already reached your location or is within 2 hours of arrival.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">2. Marketplace Products</h2>
                                <p>For items purchased through our Marketplace (diagnostic devices, equipment, etc.):</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>14-Day Return:</strong> Products can be returned within 14 days of delivery if they are unused, in original packaging, and with all tags intact.</li>
                                    <li><strong>Defective Items:</strong> If you receive a faulty device, we will offer a free replacement or a full refund including shipping costs.</li>
                                    <li><strong>Non-Returnable:</strong> Personal care items, supplements once opened, and one-time use medical supplies (needles, etc.) cannot be returned for hygiene reasons.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">3. Refund Process</h2>
                                <p>
                                    Once your refund request is approved, it will be processed through PayFast. The amount will be credited back to your original payment method (Bank Account/Wallet) within 5-7 business days.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">4. Support</h2>
                                <p>
                                    For any refund-related queries, please reach out to our billing team at:
                                    <br />
                                    Email: lab2home.help@gmail.com
                                    <br />
                                    Phone: 0306-2221078
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default RefundPolicy;
