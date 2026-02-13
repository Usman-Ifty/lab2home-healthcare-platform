import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";

const ServicePolicy = () => {
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
                                <Truck className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-bold">Shipping and Service Policy</CardTitle>
                            <p className="text-muted-foreground">Last updated: February 13, 2026</p>
                        </CardHeader>
                        <CardContent className="prose prose-blue dark:prose-invert max-w-none space-y-8">
                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">1. Home Sample Collection</h2>
                                <p>
                                    We provide home sample collection services within our service cities. Our phlebotomists aim to reach your location within the selected 2-hour time slot.
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Service Area:</strong> Currently available in Islamabad, Rawalpindi, and Lahore.</li>
                                    <li><strong>Verification:</strong> Our phlebotomists will always present their Lab2Home ID and carry a sanitized collection kit.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">2. Marketplace Deliveries</h2>
                                <p>For medical supplies and devices purchased from our Marketplace:</p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Standard Shipping:</strong> 2-4 business days for major cities.</li>
                                    <li><strong>Express Delivery:</strong> Same-day or next-day delivery available for Islamabad and Rawalpindi.</li>
                                    <li><strong>Tracking:</strong> You will receive an SMS and email with tracking details once your order is dispatched.</li>
                                    <li><strong>Charges:</strong> Standard shipping fee of Rs. 250 applies unless stated otherwise (free for orders above Rs. 5000).</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-semibold border-b pb-2">3. Report Delivery</h2>
                                <p>
                                    Most diagnostic reports are delivered digitally via your Lab2Home dashboard.
                                </p>
                                <ul className="list-disc pl-6 space-y-2">
                                    <li><strong>Turnaround Time:</strong> Routine blood tests (24 hours), Specialized cultures (48-72 hours).</li>
                                    <li><strong>Hard Copies:</strong> If requested during booking, a hard copy will be delivered to your address for an additional fee of Rs. 150.</li>
                                </ul>
                            </section>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default ServicePolicy;
