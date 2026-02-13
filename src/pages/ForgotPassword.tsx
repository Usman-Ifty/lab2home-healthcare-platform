import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Squares from "@/components/home/Squares";
import Footer from "@/components/shared/Footer";
import CardNav from "@/components/home/CardNav";
import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import logo from "/logo.svg";

// Step type
type ForgotPasswordStep = "email" | "otp" | "reset" | "success";

// Email schema
const emailSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

// OTP schema
const otpSchema = z.object({
    otp: z
        .string()
        .length(6, "OTP must be 6 digits")
        .regex(/^\d+$/, "OTP must contain only numbers"),
});

// Password reset schema
const resetSchema = z
    .object({
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[0-9]/, "Password must contain at least one number")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(
                /[!@#$%^&*(),.?":{}|<>]/,
                "Password must contain at least one special character"
            ),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

type EmailFormValues = z.infer<typeof emailSchema>;
type OTPFormValues = z.infer<typeof otpSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
    const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isNavExpanded, setIsNavExpanded] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { toast } = useToast();
    const navigate = useNavigate();

    // Email form
    const emailForm = useForm<EmailFormValues>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    });

    // OTP form
    const otpForm = useForm<OTPFormValues>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: "" },
    });

    // Reset password form
    const resetForm = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    // Handle email submission
    const onEmailSubmit = async (data: EmailFormValues) => {
        setIsLoading(true);
        try {
            const response = await authAPI.forgotPassword(data.email);

            if (response.success) {
                setEmail(data.email);
                setCurrentStep("otp");
                startResendCountdown();
                toast({
                    title: "OTP Sent",
                    description: `A verification code has been sent to ${data.email}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: response.message || "Failed to send OTP. Please try again.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An error occurred. Please try again later.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle OTP submission
    const onOTPSubmit = async (data: OTPFormValues) => {
        setIsLoading(true);
        try {
            const response = await authAPI.verifyResetOTP(email, data.otp);

            if (response.success) {
                setOtp(data.otp);
                setCurrentStep("reset");
                toast({
                    title: "OTP Verified",
                    description: "Please enter your new password",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Invalid OTP",
                    description: response.message || "Please check the code and try again.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An error occurred. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle password reset submission
    const onResetSubmit = async (data: ResetFormValues) => {
        setIsLoading(true);
        try {
            const response = await authAPI.resetPassword(email, otp, data.password);

            if (response.success) {
                setCurrentStep("success");
                toast({
                    title: "Password Reset Successful",
                    description: "Your password has been updated successfully",
                });

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate("/login");
                }, 3000);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: response.message || "Failed to reset password. Please try again.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An error occurred. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (resendCountdown > 0) return;

        setIsLoading(true);
        try {
            const response = await authAPI.forgotPassword(email);

            if (response.success) {
                startResendCountdown();
                toast({
                    title: "OTP Resent",
                    description: "A new verification code has been sent to your email",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: response.message || "Failed to resend OTP",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "An error occurred. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Start resend countdown
    const startResendCountdown = () => {
        setResendCountdown(60);
        const interval = setInterval(() => {
            setResendCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const navItems = [
        {
            label: "Services",
            bgColor: "hsl(200 85% 45%)",
            textColor: "#fff",
            links: [
                { label: "Diagnostic Tests", href: "/", ariaLabel: "View diagnostic tests" },
                { label: "Home Collection", href: "/", ariaLabel: "Home sample collection" },
                { label: "AI Reports", href: "/", ariaLabel: "AI-powered report analysis" }
            ]
        },
        {
            label: "About",
            bgColor: "hsl(180 65% 50%)",
            textColor: "#fff",
            links: [
                { label: "How It Works", href: "/", ariaLabel: "Learn how it works" },
                { label: "Our Team", href: "/", ariaLabel: "Meet our team" }
            ]
        },
        {
            label: "Contact",
            bgColor: "hsl(150 70% 45%)",
            textColor: "#fff",
            links: [
                { label: "Support", href: "/", ariaLabel: "Contact support" },
                { label: "Book Test", href: "/signup", ariaLabel: "Book a test" }
            ]
        }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            <section className="relative flex-1 flex items-center justify-center overflow-hidden py-12">
                <CardNav
                    logo={logo}
                    logoAlt="Lab2Home Logo"
                    items={navItems}
                    baseColor="#fff"
                    menuColor="hsl(200 85% 45%)"
                    onExpandChange={setIsNavExpanded}
                />
                <Squares speed={0.5} squareSize={40} direction="diagonal" />

                {/* Animated Title */}
                <div
                    className={`absolute top-24 md:top-32 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl text-center z-[1] transition-all duration-400 ${isNavExpanded ? 'opacity-0 scale-95 -translate-y-8 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'
                        }`}
                >
                    <div className="animate-fade-in-up">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
                            Reset Your{" "}
                            <span className="bg-gradient-primary bg-clip-text text-transparent">
                                Password
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground animate-pulse">
                            Secure Your Account
                        </p>
                    </div>
                </div>

                <div className="relative z-10 container mx-auto px-4 w-full max-w-2xl pointer-events-none pt-96 md:pt-72">
                    <div className="animate-fade-in-up">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 shadow-soft mb-6 mx-auto w-fit">
                            <KeyRound className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                                Password Recovery
                            </span>
                        </div>

                        {/* Main Card */}
                        <Card className="bg-card/90 backdrop-blur-sm border-primary/20 shadow-strong pointer-events-auto">
                            <CardHeader className="text-center space-y-2">
                                <CardTitle className="text-3xl font-bold">
                                    {currentStep === "email" && "Forgot Password"}
                                    {currentStep === "otp" && "Verify OTP"}
                                    {currentStep === "reset" && "Set New Password"}
                                    {currentStep === "success" && "Success!"}
                                </CardTitle>
                                <CardDescription className="text-base">
                                    {currentStep === "email" && "Enter your email to receive a verification code"}
                                    {currentStep === "otp" && `Enter the 6-digit code sent to ${email}`}
                                    {currentStep === "reset" && "Create a strong password for your account"}
                                    {currentStep === "success" && "Your password has been reset successfully"}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                {/* Step 1: Email Entry */}
                                {currentStep === "email" && (
                                    <Form {...emailForm}>
                                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                                            <FormField
                                                control={emailForm.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <Mail className="w-4 h-4 text-primary" />
                                                            Email Address
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder="john@example.com"
                                                                className="h-11"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button
                                                type="submit"
                                                size="lg"
                                                disabled={isLoading}
                                                className="w-full text-lg py-6 shadow-medium hover:shadow-strong transition-all duration-300 group"
                                            >
                                                <Mail className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                                {isLoading ? "Sending..." : "Send Verification Code"}
                                            </Button>

                                            <div className="text-center">
                                                <Link
                                                    to="/login"
                                                    className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Back to Login
                                                </Link>
                                            </div>
                                        </form>
                                    </Form>
                                )}

                                {/* Step 2: OTP Verification */}
                                {currentStep === "otp" && (
                                    <Form {...otpForm}>
                                        <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-5">
                                            <FormField
                                                control={otpForm.control}
                                                name="otp"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <KeyRound className="w-4 h-4 text-primary" />
                                                            Verification Code
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="text"
                                                                placeholder="000000"
                                                                className="h-11 text-center text-2xl tracking-widest"
                                                                maxLength={6}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription className="text-xs text-center">
                                                            Enter the 6-digit code sent to your email
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button
                                                type="submit"
                                                size="lg"
                                                disabled={isLoading}
                                                className="w-full text-lg py-6 shadow-medium hover:shadow-strong transition-all duration-300 group"
                                            >
                                                <CheckCircle2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                                {isLoading ? "Verifying..." : "Verify Code"}
                                            </Button>

                                            <div className="flex items-center justify-between text-sm">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentStep("email")}
                                                    className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                                                >
                                                    <ArrowLeft className="w-4 h-4" />
                                                    Change Email
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleResendOTP}
                                                    disabled={resendCountdown > 0 || isLoading}
                                                    className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {resendCountdown > 0
                                                        ? `Resend in ${resendCountdown}s`
                                                        : "Resend Code"}
                                                </button>
                                            </div>
                                        </form>
                                    </Form>
                                )}

                                {/* Step 3: Password Reset */}
                                {currentStep === "reset" && (
                                    <Form {...resetForm}>
                                        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-5">
                                            <FormField
                                                control={resetForm.control}
                                                name="password"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <Lock className="w-4 h-4 text-primary" />
                                                            New Password
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showPassword ? "text" : "password"}
                                                                    placeholder="••••••••"
                                                                    className="h-11 pr-10"
                                                                    {...field}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword((prev) => !prev)}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                                                >
                                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                                </button>
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription className="text-xs">
                                                            At least 8 characters with an uppercase letter, number & special character
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={resetForm.control}
                                                name="confirmPassword"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <Lock className="w-4 h-4 text-primary" />
                                                            Confirm New Password
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showConfirmPassword ? "text" : "password"}
                                                                    placeholder="••••••••"
                                                                    className="h-11 pr-10"
                                                                    {...field}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                                                >
                                                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                                </button>
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button
                                                type="submit"
                                                size="lg"
                                                disabled={isLoading}
                                                className="w-full text-lg py-6 shadow-medium hover:shadow-strong transition-all duration-300 group"
                                            >
                                                <KeyRound className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                                {isLoading ? "Resetting..." : "Reset Password"}
                                            </Button>
                                        </form>
                                    </Form>
                                )}

                                {/* Step 4: Success */}
                                {currentStep === "success" && (
                                    <div className="text-center space-y-6 py-8">
                                        <div className="flex justify-center">
                                            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="text-xl font-semibold">Password Reset Complete!</h3>
                                            <p className="text-muted-foreground">
                                                You can now sign in with your new password
                                            </p>
                                        </div>

                                        <Button
                                            size="lg"
                                            onClick={() => navigate("/login")}
                                            className="w-full text-lg py-6 shadow-medium hover:shadow-strong transition-all duration-300"
                                        >
                                            Go to Login
                                        </Button>
                                    </div>
                                )}

                                {/* Back to Home */}
                                {currentStep !== "success" && (
                                    <div className="mt-6 text-center">
                                        <Link
                                            to="/"
                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            ← Back to Home
                                        </Link>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mt-8 pt-6 border-t border-border/50">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary mb-1">100%</div>
                                <div className="text-xs text-muted-foreground">Secure</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-secondary mb-1">24/7</div>
                                <div className="text-xs text-muted-foreground">Support</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-health mb-1">AI</div>
                                <div className="text-xs text-muted-foreground">Powered</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float -z-10" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-slow -z-10" />
            </section>

            <Footer />
        </div>
    );
}
