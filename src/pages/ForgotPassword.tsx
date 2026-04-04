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

import { KeyRound, Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, User, FlaskConical, Bike, ShieldCheck } from "lucide-react";
import logo from "/logo.svg";

type UserRole = "patient" | "lab" | "phlebotomist" | "admin";

const roleDetails: Record<UserRole, { id: UserRole; title: string; description: string; icon: React.ElementType; color: string; bg: string }> = {
  patient: {
    id: "patient",
    title: "Patient",
    description: "Book tests, view reports & manage your health",
    icon: User,
    color: "text-primary",
    bg: "bg-primary/10 group-hover:bg-primary/20",
  },
  lab: {
    id: "lab",
    title: "Lab",
    description: "Manage tests, appointments & digital reports",
    icon: FlaskConical,
    color: "text-health",
    bg: "bg-health/10 group-hover:bg-health/20",
  },
  phlebotomist: {
    id: "phlebotomist",
    title: "Phlebotomist",
    description: "Collect samples at patient locations",
    icon: Bike,
    color: "text-secondary",
    bg: "bg-secondary/10 group-hover:bg-secondary/20",
  },
  admin: {
    id: "admin",
    title: "Admin",
    description: "System administration and management",
    icon: ShieldCheck,
    color: "text-destructive",
    bg: "bg-destructive/10 group-hover:bg-destructive/20",
  },
};

const RoleSelection = ({
  onSelectRole,
}: {
  onSelectRole: (role: UserRole) => void;
}) => {
  const roles = Object.values(roleDetails);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="grid gap-3">
        {roles.map((role, i) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onSelectRole(role.id)}
              className={`group w-full flex items-center gap-4 p-4 rounded-xl border border-border/60 hover:border-primary/40 hover:shadow-medium bg-background/60 hover:bg-background transition-all duration-300 text-left anim-delay-${(i + 1) * 100} animate-fade-in-up`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`${role.bg} p-3 rounded-xl transition-colors duration-300`}>
                <Icon className={`w-6 h-6 ${role.color}`} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-foreground">{role.title}</div>
                <div className="text-sm text-muted-foreground">{role.description}</div>
              </div>
              <div className="text-muted-foreground group-hover:text-primary transition-colors">›</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

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
    const [role, setRole] = useState<UserRole | null>(null);
    const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
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
            const response = await authAPI.forgotPassword(data.email, role);

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
            const response = await authAPI.verifyResetOTP(email, data.otp, role);

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
            const response = await authAPI.resetPassword(email, otp, data.password, role);

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
            const response = await authAPI.forgotPassword(email, role);

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
        <div className="min-h-screen flex flex-col bg-background font-sans overflow-hidden">
            {/* Minimal Top Bar */}
            <header className="absolute top-0 w-full z-50 p-6 flex justify-between items-center bg-background/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-b border-border/40 lg:border-none">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <img
                          src={logo}
                          alt="Lab2Home"
                          className="h-full w-full origin-center scale-[1.8] object-contain"
                        />
                      </div>
                    <span className="font-bold text-xl tracking-tight hidden sm:block">
                        <span className="text-foreground">Lab2</span>
                        <span className="text-primary">Home</span>
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                        Remember your password?
                    </span>
                    <Link to="/login">
                        <Button variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary">
                            Sign In
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col lg:flex-row">
                {/* ── LEFT: Form Panel ────────────────────────────────────────────── */}
                <div className="flex-1 lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background relative overflow-hidden transition-all duration-400 animate-slide-in-right">
                    {/* Subtle background circles */}
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="w-full max-w-xl relative z-10 pt-16 lg:pt-0">
                        {/* Title and Form Area */}
                        {!role ? (
                            <>
                                <div className="flex items-center gap-4 mb-2 animate-fade-in-up">
                                    <h1 className="text-3xl font-bold text-foreground">
                                        Password Recovery
                                    </h1>
                                </div>
                                <p className="text-muted-foreground mb-8 mt-2 animate-fade-in-up anim-delay-100">
                                    To get started, please select your account type
                                </p>
                                <RoleSelection onSelectRole={setRole} />
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-2 animate-fade-in-up">
                                    {currentStep === "email" && (
                                        <button
                                            onClick={() => {
                                                setRole(null);
                                                setEmail("");
                                            }}
                                            className="p-2 lg:hidden rounded-xl border border-border/40 hover:bg-muted/50 transition-colors shadow-sm group mr-1"
                                            aria-label="Change role"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        </button>
                                    )}
                                    <div className="p-2.5 rounded-xl border border-border/40 shadow-sm bg-background/50">
                                        {(() => {
                                            const Icon = roleDetails[role].icon;
                                            return <Icon className={`w-6 h-6 ${roleDetails[role].color}`} />;
                                        })()}
                                    </div>
                                    <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                        {currentStep === "email" && "Forgot Password"}
                                        {currentStep === "otp" && "Verify OTP"}
                                        {currentStep === "reset" && "Set New Password"}
                                        {currentStep === "success" && "Success!"}
                                    </h1>
                                </div>
                                <div className="flex items-center justify-between mb-8 mt-2 animate-fade-in-up anim-delay-100">
                                    <p className="text-muted-foreground">
                                        {currentStep === "email" && `Enter your email to reset your ${roleDetails[role].title.toLowerCase()} account`}
                                        {currentStep === "otp" && `Enter the 6-digit code sent to ${email}`}
                                        {currentStep === "reset" && "Create a strong password for your account"}
                                        {currentStep === "success" && "Your password has been reset successfully"}
                                    </p>
                                    {currentStep === "email" && (
                                        <button
                                            onClick={() => {
                                                setRole(null);
                                                setEmail("");
                                            }}
                                            className="hidden lg:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/60 px-3 py-1.5 rounded-full transition-all"
                                        >
                                            Change Role
                                        </button>
                                    )}
                                </div>

                                {/* Form Card */}
                                <div className="glass-card rounded-2xl p-8 animate-fade-in-up shadow-sm">
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
                        </div>
                        </>
                        )}

                        {/* Trust Badges */}
                        <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-border/50 animate-fade-in anim-delay-500">
                            <div className="text-center">
                                <div className="text-xl font-bold text-primary mb-1">100%</div>
                                <div className="text-xs text-muted-foreground">Secure</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-secondary mb-1">24/7</div>
                                <div className="text-xs text-muted-foreground">Support</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-health mb-1">AI</div>
                                <div className="text-xs text-muted-foreground">Powered</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Gradient Panel (hidden on mobile) ──────────────────────── */}
                <div className="hidden lg:flex lg:w-1/2 auth-gradient-panel flex-col items-center justify-center relative animate-slide-in-left">
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                        <div className="absolute rounded-full blur-3xl opacity-30 animate-blob w-72 h-72 bg-white top-10 -left-10" />
                        <div className="absolute rounded-full blur-3xl opacity-30 animate-blob w-96 h-96 bg-primary-dark bottom-10 right-0" />
                        <div className="absolute rounded-full blur-3xl opacity-30 animate-blob w-56 h-56 bg-secondary top-1/2 left-1/3" />
                    </div>
                    {/* Panel content */}
                    <div className="relative z-10 text-center px-12 max-w-md">
                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-8 shadow-lg">
                            <KeyRound className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                            Secure Your{" "}
                            <span className="text-white/80">Account</span>
                        </h2>
                        <p className="text-white/75 text-lg mb-10 leading-relaxed">
                            Recover access to your Lab2Home profile efficiently and securely in just a few steps.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
