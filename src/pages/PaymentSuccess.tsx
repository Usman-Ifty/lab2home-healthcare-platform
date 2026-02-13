import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShoppingBag } from 'lucide-react';

const PaymentSuccess = () => {
    const navigate = useNavigate();

    return (
        <DashboardLayout role="patient">
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-gray-600">
                            Thank you for your payment. Your order has been confirmed and is being processed.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate('/patient/orders')}
                                className="w-full"
                            >
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                View My Orders
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/marketplace')}
                                className="w-full"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PaymentSuccess;
