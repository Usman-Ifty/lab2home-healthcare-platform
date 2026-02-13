import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ShoppingCart } from 'lucide-react';

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <DashboardLayout role="patient">
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md text-center border-red-100">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <XCircle className="h-16 w-16 text-red-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Payment Cancelled</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-gray-600">
                            The payment process was cancelled. No charges were made.
                            Your items are still in your cart if you'd like to try again.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate('/patient/cart')}
                                className="w-full"
                            >
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Back to Cart
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

export default PaymentCancel;
