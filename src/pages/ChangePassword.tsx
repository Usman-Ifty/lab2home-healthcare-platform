import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Lock,
    Mail,
    ArrowLeft,
    Eye,
    EyeOff,
    Shield,
    CheckCircle2,
    KeyRound,
    Sparkles,
    Send
} from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Step = "request" | "verify" | "change";

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
    { id: "request", label: "Request", icon: Send },
    { id: "verify", label: "Verify", icon: Shield },
    { id: "change", label: "Update", icon: KeyRound },
];

export default function ChangePassword() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState<Step>("request");
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const currentStepIndex = steps.findIndex((s) => s.id === step);

    const handleRequestOTP = async () => {
        if (!user?.email) {
            toast.error("User email not found");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/request-password-change-otp`, {
                email: user.email,
            });

            if (response.data.success) {
                toast.success("OTP sent to your email!");
                setStep("verify");
            } else {
                toast.error(response.data.message || "Failed to send OTP");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/verify-password-change-otp`, {
                email: user?.email,
                otp,
            });

            if (response.data.success) {
                toast.success("OTP verified successfully!");
                setStep("change");
            } else {
                toast.error(response.data.message || "Invalid OTP");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            toast.error("Password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/change-password`, {
                email: user?.email,
                otp,
                newPassword,
            });

            if (response.data.success) {
                toast.success("Password changed successfully!");
                setTimeout(() => {
                    navigate(-1);
                }, 1500);
            } else {
                toast.error(response.data.message || "Failed to change password");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <Button
                    variant="ghost"
                    onClick={() => navigate(-1)}
                    className="mb-6 gap-2 hover:bg-background/80"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>

                <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
                    <CardHeader className="space-y-4 pb-6">
                        {/* Icon with glow */}
                        <motion.div
                            className="flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.1 }}
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                                    <Lock className="h-8 w-8 text-primary-foreground" />
                                </div>
                                <motion.div
                                    className="absolute -top-1 -right-1"
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    <Sparkles className="h-5 w-5 text-secondary" />
                                </motion.div>
                            </div>
                        </motion.div>

                        <div className="text-center space-y-1">
                            <CardTitle className="text-2xl font-bold">Change Password</CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Secure your account with a new password
                            </CardDescription>
                        </div>

                        {/* Step Indicator */}
                        <div className="flex items-center justify-center gap-2 pt-2">
                            {steps.map((s, index) => {
                                const isCompleted = index < currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const Icon = s.icon;

                                return (
                                    <React.Fragment key={s.id}>
                                        <motion.div
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isCompleted
                                                    ? "bg-success/20 text-success"
                                                    : isCurrent
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted text-muted-foreground"
                                                }`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 className="h-4 w-4" />
                                            ) : (
                                                <Icon className="h-4 w-4" />
                                            )}
                                            <span className="hidden sm:inline">{s.label}</span>
                                        </motion.div>
                                        {index < steps.length - 1 && (
                                            <div
                                                className={`w-8 h-0.5 rounded-full transition-colors ${index < currentStepIndex ? "bg-success" : "bg-muted"
                                                    }`}
                                            />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Request OTP */}
                            {step === "request" && (
                                <motion.div
                                    key="request"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <p className="text-sm text-muted-foreground text-center">
                                            We'll send a verification code to your registered email address
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium">
                                            Email Address
                                        </Label>
                                        <div className="relative group">
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={user?.email || ""}
                                                    disabled
                                                    className="pl-11 h-12 bg-muted/50 border-muted"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleRequestOTP}
                                        disabled={loading}
                                        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                                    >
                                        {loading ? (
                                            <motion.div
                                                className="flex items-center gap-2"
                                                animate={{ opacity: [1, 0.5, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                <Send className="h-5 w-5" />
                                                Sending...
                                            </motion.div>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <Send className="h-5 w-5" />
                                                Send Verification Code
                                            </span>
                                        )}
                                    </Button>
                                </motion.div>
                            )}

                            {/* Step 2: Verify OTP */}
                            {step === "verify" && (
                                <motion.div
                                    key="verify"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                                        <p className="text-sm text-center text-muted-foreground">
                                            Enter the 6-digit code sent to{" "}
                                            <span className="font-medium text-foreground">{user?.email}</span>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="otp" className="text-sm font-medium">
                                            Verification Code
                                        </Label>
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="• • • • • •"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                            maxLength={6}
                                            className="text-center text-3xl tracking-[0.5em] h-14 font-mono bg-muted/30 border-2 focus:border-primary"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleVerifyOTP}
                                            disabled={loading || otp.length !== 6}
                                            className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25"
                                        >
                                            {loading ? (
                                                <motion.span
                                                    animate={{ opacity: [1, 0.5, 1] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                >
                                                    Verifying...
                                                </motion.span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    <Shield className="h-5 w-5" />
                                                    Verify Code
                                                </span>
                                            )}
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            onClick={handleRequestOTP}
                                            disabled={loading}
                                            className="w-full text-muted-foreground hover:text-foreground"
                                        >
                                            Didn't receive code? <span className="text-primary ml-1">Resend</span>
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Change Password */}
                            {step === "change" && (
                                <motion.div
                                    key="change"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                                        <p className="text-sm text-success">
                                            Identity verified! Create your new password.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPassword" className="text-sm font-medium">
                                                New Password
                                            </Label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    id="newPassword"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Enter new password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="pl-11 pr-11 h-12"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            {newPassword && (
                                                <div className="flex gap-1 mt-2">
                                                    {[1, 2, 3, 4].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= level * 3
                                                                    ? level <= 2
                                                                        ? "bg-warning"
                                                                        : "bg-success"
                                                                    : "bg-muted"
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                                Confirm Password
                                            </Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                                <Input
                                                    id="confirmPassword"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirm new password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className={`pl-11 pr-11 h-12 ${confirmPassword && confirmPassword === newPassword
                                                            ? "border-success focus:ring-success"
                                                            : ""
                                                        }`}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </button>
                                            </div>
                                            {confirmPassword && confirmPassword === newPassword && (
                                                <p className="text-xs text-success flex items-center gap-1 mt-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Passwords match
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={loading || !newPassword || !confirmPassword}
                                        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25"
                                    >
                                        {loading ? (
                                            <motion.span
                                                animate={{ opacity: [1, 0.5, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                Updating Password...
                                            </motion.span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                <KeyRound className="h-5 w-5" />
                                                Update Password
                                            </span>
                                        )}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </CardContent>
                </Card>

                {/* Security note */}
                <motion.p
                    className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Shield className="h-3 w-3" />
                    Your password is encrypted and secure
                </motion.p>
            </motion.div>
        </div>
    );
}
