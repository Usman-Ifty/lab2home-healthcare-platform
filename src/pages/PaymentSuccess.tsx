import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShoppingBag, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { verifyStripePayment } from '@/lib/api';
import { verifyMarketplaceStripePayment } from '@/services/marketplace.service';
import { useAuth } from '@/contexts/AuthContext';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { token } = useAuth();
    const [verifying, setVerifying] = useState(true);
    const [error, setError] = useState(false);

    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');

    useEffect(() => {
        const verify = async () => {
            if (!sessionId || !token) {
                setVerifying(false);
                return;
            }

            try {
                // Try verifying as a marketplace order first, then as a booking if needed
                // Or we can differentiate by checking something in the URL
                // For simplicity, let's try both or use a generic one if we had it
                
                // If it's from the marketplace 'Checkout' page, it usually has orderId
                // If it's from 'TestBookingForm', it also has orderId (which is booking ID)
                
                let success = false;
                
                // Try Marketplace verification
                console.log('🔍 Verifying Marketplace payment...');
                try {
                    const res = await verifyMarketplaceStripePayment(token, sessionId, orderId || '');
                    console.log('📦 Marketplace response:', res);
                    if (res.success) {
                        success = true;
                    }
                } catch (e) {
                    console.warn("Marketplace verification threw error:", e);
                }

                if (!success) {
                    // If marketplace fails, try booking
                    console.log('🔍 Verifying Booking payment...');
                    try {
                        const res = await verifyStripePayment(sessionId, orderId || '');
                        console.log('📦 Booking response:', res);
                        if (res.success) {
                            success = true;
                        }
                    } catch (e2) {
                        console.error("Booking verification threw error:", e2);
                    }
                }

                if (success) {
                    toast.success('Payment verified successfully!');
                } else {
                    console.error('❌ All verification attempts failed');
                    setError(true);
                    toast.error('Payment verification failed. Please contact support.');
                }
            } catch (err) {
                console.error('Verification error:', err);
                setError(true);
            } finally {
                setVerifying(false);
            }
        };

        verify();
    }, [sessionId, orderId, token]);

    return (
        <DashboardLayout role="patient">
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="w-full max-w-md text-center shadow-xl border-t-4 border-green-500">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            {verifying ? (
                                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                            ) : error ? (
                                <AlertCircle className="h-16 w-16 text-red-500" />
                            ) : (
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            )}
                        </div>
                        <CardTitle className="text-2xl font-bold">
                            {verifying ? 'Verifying Payment...' : error ? 'Verification Failed' : 'Payment Successful!'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-gray-600">
                            {verifying 
                                ? 'We are confirming your payment with Stripe. Please do not close this page.' 
                                : error 
                                ? 'Something went wrong while verifying your payment. If your card was charged, please contact us.' 
                                : 'Thank you for your payment. Your request has been confirmed and is being processed.'}
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate('/patient/orders')}
                                className="w-full"
                                disabled={verifying}
                            >
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                View My Orders
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/patient')}
                                className="w-full"
                                disabled={verifying}
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default PaymentSuccess;
