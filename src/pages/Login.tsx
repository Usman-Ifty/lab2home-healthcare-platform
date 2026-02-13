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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Squares from "@/components/home/Squares";
import Footer from "@/components/shared/Footer";
import CardNav from "@/components/home/CardNav";
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logo from "/logo.svg";
import { publicNavItems } from "@/config/public-nav";

// Login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);
  const [loginError, setLoginError] = useState("");
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError("");

    const result = await login(data.email, data.password);

    if (!result.success) {
      const errorMessage = result.message || "Invalid email or password. Please try again.";
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

  /* navItems removed */

  return (
    <div className="min-h-screen flex flex-col">
      <section className="relative flex-1 flex items-center justify-center overflow-hidden py-12">
        <CardNav
          logo={logo}
          logoAlt="Lab2Home Logo"
          items={publicNavItems}
          baseColor="#fff"
          menuColor="hsl(200 85% 45%)"
          onExpandChange={setIsNavExpanded}
        />
        <Squares speed={0.5} squareSize={40} direction="diagonal" />

        {/* Animated Title - Shows when navbar is closed, hides when nav cards appear */}
        <div
          className={`absolute top-24 md:top-32 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl text-center z-[1] transition-all duration-400 ${isNavExpanded ? 'opacity-0 scale-95 -translate-y-8 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'
            }`}
        >
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
              Welcome Back to{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Lab2Home
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-pulse">
              Your Health, Simplified
            </p>
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 w-full max-w-2xl pointer-events-none pt-96 md:pt-72">
          <div className="animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border border-primary/20 shadow-soft mb-6 mx-auto w-fit">
              <LogIn className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Welcome Back
              </span>
            </div>

            {/* Login Card */}
            <Card className="bg-card/90 backdrop-blur-sm border-primary/20 shadow-strong pointer-events-auto">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-3xl font-bold">
                  Sign in to <span className="bg-gradient-primary bg-clip-text text-transparent">Lab2Home</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>

              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
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
                              placeholder="ahmad@example.com"
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            Password
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
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
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

                    {loginError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
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
                        className="text-sm text-primary hover:underline hover:text-primary/80 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full text-lg py-6 shadow-medium hover:shadow-strong transition-all duration-300 group"
                    >
                      <LogIn className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Sign In
                    </Button>
                  </form>
                </Form>

                {/* Signup Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      to="/signup"
                      className="text-primary font-medium hover:underline hover:text-primary/80 transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>

                {/* Back to Home */}
                <div className="mt-4 text-center">
                  <Link
                    to="/"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to Home
                  </Link>
                </div>
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

