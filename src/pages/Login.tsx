import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Footer from "@/components/shared/Footer";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  FlaskConical,
  HeartPulse,
  ShieldCheck,
  Activity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "/logo.svg";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Floating icon on the gradient panel ──────────────────────────────────────
const FloatingIcon = ({
  icon: Icon,
  className,
}: {
  icon: React.ElementType;
  className?: string;
}) => (
  <div
    className={`absolute flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg ${className}`}
  >
    <Icon className="text-white/90" />
  </div>
);

// ── Animated blob orb ─────────────────────────────────────────────────────────
const Blob = ({ className }: { className?: string }) => (
  <div
    className={`absolute rounded-full blur-3xl opacity-30 animate-blob ${className}`}
  />
);

export default function Login() {
  const [role, setRole] = useState<"patient" | "lab" | "phlebotomist" | "admin">("patient");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, logout, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // If a user navigates back to the login page via browser back button,
    // ensure their token is expired/cleared as requested.
    if (isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setLoginError("");

    const result = await login(data.email, data.password, role);

    setIsLoading(false);

    if (!result.success) {
      const errorMessage =
        result.message || "Invalid email or password. Please try again.";
      setLoginError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } else {
      toast({
        title: "Login Successful",
        description: "Welcome back! Redirecting to your dashboard...",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal Top Bar */}
      <header className="absolute top-0 w-full z-50 p-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <img src={logo} alt="Lab2Home" className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            <span className="text-foreground">Lab2</span>
            <span className="text-primary">Home</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Don't have an account?
          </span>
          <Link to="/signup">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary">
              Sign Up
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* ── LEFT: Gradient Panel (hidden on mobile) ──────────────────────── */}
        <div className="hidden lg:flex lg:w-1/2 auth-gradient-panel flex-col items-center justify-center relative animate-slide-in-left">
          {/* Blob orbs */}
          <Blob className="w-72 h-72 bg-white top-10 -left-10" />
          <Blob className="w-96 h-96 bg-primary-dark bottom-10 right-0" />
          <Blob className="w-56 h-56 bg-secondary top-1/2 left-1/3" />

          {/* Floating icons */}
          <FloatingIcon
            icon={FlaskConical}
            className="top-[15%] left-[12%] w-14 h-14 animate-bounce-gentle"
          />
          <FloatingIcon
            icon={HeartPulse}
            className="top-[35%] right-[10%] w-12 h-12 animate-float"
          />
          <FloatingIcon
            icon={ShieldCheck}
            className="bottom-[20%] left-[18%] w-12 h-12 animate-float-slow"
          />
          <FloatingIcon
            icon={Activity}
            className="bottom-[38%] right-[15%] w-14 h-14 animate-bounce-gentle [animation-delay:1.5s]"
          />

          {/* Panel content */}
          <div className="relative z-10 text-center px-12 max-w-md">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <img src={logo} alt="Lab2Home" className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Welcome Back to{" "}
              <span className="text-white/80">Lab2Home</span>
            </h2>
            <p className="text-white/75 text-lg mb-10 leading-relaxed">
              Your trusted healthcare companion — book tests, track results, and
              manage your health from home.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "50K+", label: "Patients" },
                { value: "200+", label: "Labs" },
                { value: "99%", label: "Accuracy" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
                >
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form Panel ─────────────────────────────────────────────── */}
        <div
          className="flex-1 lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background relative overflow-hidden transition-all duration-400 animate-slide-in-right"
        >
          {/* Subtle background circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="w-full max-w-md relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-soft mb-6 animate-fade-in">
              <LogIn className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Sign in to your account
              </span>
            </div>

            {/* Card */}
            <div className="glass-card rounded-2xl p-8 animate-fade-in-up">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                Welcome back
              </h1>
              <p className="text-muted-foreground mb-8">
                Enter your credentials to continue
              </p>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Role Selection */}
                  <div className="flex gap-2 mb-6 p-1 bg-background/60 border border-border/60 rounded-lg animate-fade-in-up">
                    {(['patient', 'phlebotomist', 'lab', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex-1 capitalize text-sm py-2 rounded-md font-medium transition-all ${
                          role === r 
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* Email */}
                  <div className="animate-fade-in-up anim-delay-100">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-foreground/80">
                            <Mail className="w-4 h-4 text-primary" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <div className="auth-input rounded-lg">
                              <Input
                                type="email"
                                placeholder="ahmad@example.com"
                                className="h-11 bg-background/60 border-border/60 focus:border-primary/50 transition-all"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Password */}
                  <div className="animate-fade-in-up anim-delay-200">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-foreground/80">
                            <Lock className="w-4 h-4 text-primary" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="auth-input relative rounded-lg">
                              <Input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className="h-11 pr-10 bg-background/60 border-border/60 focus:border-primary/50 transition-all"
                                {...field}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={
                                  showPassword ? "Hide password" : "Show password"
                                }
                              >
                                {showPassword ? (
                                  <Eye className="w-4 h-4" />
                                ) : (
                                  <EyeOff className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Error */}
                  {loginError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Remember me / Forgot */}
                  <div className="flex items-center justify-between animate-fade-in-up anim-delay-300">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="remember"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Remember me
                      </label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors font-medium"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit */}
                  <div className="animate-fade-in-up anim-delay-350">
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-base py-6 shadow-medium hover:shadow-strong transition-all duration-300 group relative overflow-hidden"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>

              {/* Sign up link */}
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors"
                >
                  Create one free →
                </Link>
              </p>
            </div>

            {/* Back to home */}
            <div className="mt-6 text-center animate-fade-in anim-delay-500">
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Home
              </Link>
            </div>

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
      </main>

      <Footer />
    </div>
  );
}
