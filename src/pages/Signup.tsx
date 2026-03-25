import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authAPI } from "@/lib/api";
import * as storage from "@/utils/storage";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import Footer from "@/components/shared/Footer";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Calendar,
  FlaskConical,
  ArrowLeft,
  Building2,
  GraduationCap,
  MapPin,
  FileText,
  Bike,
  Eye,
  EyeOff,
  Loader2,
  HeartPulse,
  ShieldCheck,
  Activity,
  CheckCircle2,
} from "lucide-react";
import logo from "/logo.svg";

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRole = "patient" | "lab" | "phlebotomist";

// ── Role config (panel colours + icons + text) ────────────────────────────────
const roleConfig: Record<
  UserRole,
  {
    gradient: string;
    blobColor1: string;
    blobColor2: string;
    panelTitle: string;
    panelSub: string;
    benefits: string[];
    Icon: React.ElementType;
    accentColor: string;
  }
> = {
  patient: {
    gradient: "linear-gradient(135deg, hsl(200 85% 45%) 0%, hsl(180 65% 50%) 100%)",
    blobColor1: "bg-blue-400",
    blobColor2: "bg-cyan-400",
    panelTitle: "Your Health, Delivered",
    panelSub:
      "Book lab tests from home, receive certified reports, and track your wellness journey.",
    benefits: ["Book tests in minutes", "Home sample collection", "Digital reports", "AI health insights"],
    Icon: HeartPulse,
    accentColor: "text-cyan-200",
  },
  lab: {
    gradient: "linear-gradient(135deg, hsl(180 65% 40%) 0%, hsl(150 70% 45%) 100%)",
    blobColor1: "bg-teal-400",
    blobColor2: "bg-green-400",
    panelTitle: "Grow Your Lab Business",
    panelSub:
      "Reach thousands of patients, manage appointments, and digitise your diagnostic lab.",
    benefits: ["Expand patient reach", "Manage test inventory", "Digital reporting", "Revenue analytics"],
    Icon: FlaskConical,
    accentColor: "text-teal-200",
  },
  phlebotomist: {
    gradient: "linear-gradient(135deg, hsl(220 80% 50%) 0%, hsl(200 85% 45%) 60%, hsl(270 60% 55%) 100%)",
    blobColor1: "bg-blue-400",
    blobColor2: "bg-purple-400",
    panelTitle: "Earn on Your Schedule",
    panelSub:
      "Connect with patients in your area, manage your routes, and grow your phlebotomy practice.",
    benefits: ["Flexible working hours", "Route optimisation", "Instant job alerts", "Verified credentials"],
    Icon: Bike,
    accentColor: "text-blue-200",
  },
};

// Default panel when no role is selected yet
const defaultPanel = {
  gradient: "linear-gradient(135deg, hsl(200 85% 45%) 0%, hsl(180 65% 50%) 50%, hsl(150 70% 45%) 100%)",
  blobColor1: "bg-blue-300",
  blobColor2: "bg-teal-300",
};

// ── Zod Schemas ───────────────────────────────────────────────────────────────
const baseSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(11, "Phone number must be at least 11 digits")
    .max(14, "Phone number seems invalid")
    .regex(
      /^(?:\+92|0092|0)3[0-9]{9}$/,
      "Please enter a valid Pakistani phone number (e.g., 03XXXXXXXXX or +923XXXXXXXXX)"
    ),
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
});

const patientSchema = baseSchema.extend({
  role: z.literal("patient"),
  dateOfBirth: z
    .string()
    .min(1, "Please select your date of birth")
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate <= today;
    }, "Date of birth cannot be in the future"),
  age: z.number().optional(),
  address: z.string().min(5, "Please enter your address"),
});

const labSchema = baseSchema.extend({
  role: z.literal("lab"),
  labName: z.string().min(2, "Please enter lab name"),
  licenseCopy: z
    .instanceof(File, { message: "Please upload your lab license copy" })
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine((file) => file.type === "application/pdf", "File must be a PDF document"),
  labAddress: z.string().min(5, "Please enter lab address"),
});

const phlebotomistSchema = baseSchema.extend({
  role: z.literal("phlebotomist"),
  qualification: z.string().min(2, "Please enter your qualification"),
  trafficLicenseCopy: z
    .instanceof(File, { message: "Please upload your traffic license copy" })
    .refine((file) => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB")
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "application/pdf"].includes(file.type),
      "File must be an image (JPEG, PNG) or PDF"
    ),
});

const signupSchema = z
  .discriminatedUnion("role", [patientSchema, labSchema, phlebotomistSchema])
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const Blob = ({ className }: { className?: string }) => (
  <div className={`absolute rounded-full blur-3xl opacity-25 animate-blob ${className}`} />
);

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
    <Icon className="text-white/85" />
  </div>
);

// ── Password field with show/hide ─────────────────────────────────────────────
const PasswordInput = ({
  field,
  placeholder = "••••••••",
  className = "",
}: {
  field: any;
  placeholder?: string;
  className?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-input relative rounded-lg">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        className={`h-11 pr-10 bg-background/60 border-border/60 focus:border-primary/50 transition-all ${className}`}
        {...field}
      />
      <button
        type="button"
        onClick={() => setShow((p) => !p)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ── Role Selection ─────────────────────────────────────────────────────────────
const RoleSelection = ({
  onSelectRole,
}: {
  onSelectRole: (role: UserRole) => void;
}) => {
  const roles: { id: UserRole; title: string; description: string; icon: React.ElementType; color: string; bg: string }[] = [
    {
      id: "patient",
      title: "Patient",
      description: "Book tests, view reports & manage your health",
      icon: User,
      color: "text-primary",
      bg: "bg-primary/10 group-hover:bg-primary/20",
    },
    {
      id: "lab",
      title: "Lab",
      description: "Manage tests, appointments & digital reports",
      icon: FlaskConical,
      color: "text-health",
      bg: "bg-health/10 group-hover:bg-health/20",
    },
    {
      id: "phlebotomist",
      title: "Phlebotomist",
      description: "Collect samples at patient locations",
      icon: Bike,
      color: "text-secondary",
      bg: "bg-secondary/10 group-hover:bg-secondary/20",
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-1">Choose Your Role</h3>
        <p className="text-sm text-muted-foreground">
          Select the account type that best describes you
        </p>
      </div>

      <div className="grid gap-3">
        {roles.map((role, i) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
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

// ── Patient Form ───────────────────────────────────────────────────────────────
const PatientForm = ({
  form,
  onSubmit,
  isLoading,
}: {
  form: any;
  onSubmit: (data: SignupFormValues) => void;
  isLoading?: boolean;
}) => (
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Muhammad Ahmad" className="h-11 bg-background/60" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ahmad@example.com" className="h-11 bg-background/60" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "140ms" }}>
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Phone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="03XXXXXXXXX" className="h-11 bg-background/60" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Address</FormLabel>
              <FormControl>
                <Input placeholder="Your complete address" className="h-11 bg-background/60" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "220ms" }}>
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Date of Birth</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  className="h-11 bg-background/60"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.value) {
                      const birthDate = new Date(e.target.value);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                      form.setValue("age", age >= 0 ? age : 0);
                    } else {
                      form.setValue("age", undefined);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "260ms" }}>
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Age</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Auto-calculated" className="h-11 bg-muted" readOnly {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Password</FormLabel>
              <FormControl><PasswordInput field={field} /></FormControl>
              <FormDescription className="text-xs">8+ chars, uppercase, number & special char</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "340ms" }}>
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Confirm Password</FormLabel>
              <FormControl><PasswordInput field={field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>

    <div className="animate-fade-in-up" style={{ animationDelay: "380ms" }}>
      <Button type="submit" size="lg" disabled={isLoading} className="w-full py-6 shadow-medium hover:shadow-strong transition-all duration-300 group">
        {isLoading ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating Account...</>
        ) : (
          <><UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />Create Patient Account</>
        )}
      </Button>
    </div>
  </form>
);

// ── Lab Form ───────────────────────────────────────────────────────────────────
const LabForm = ({
  form,
  onSubmit,
  isLoading,
}: {
  form: any;
  onSubmit: (data: SignupFormValues) => void;
  isLoading?: boolean;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Contact Person</FormLabel>
              <FormControl><Input placeholder="Muhammad Ahmad" className="h-11 bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Email</FormLabel>
              <FormControl><Input type="email" placeholder="lab@example.com" className="h-11 bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "140ms" }}>
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Phone</FormLabel>
              <FormControl><Input type="tel" placeholder="03XXXXXXXXX" className="h-11 bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <FormField control={form.control} name="labName" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" />Lab Name</FormLabel>
              <FormControl><Input placeholder="ABC Diagnostic Lab" className="h-11 bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="md:col-span-2 animate-fade-in-up" style={{ animationDelay: "220ms" }}>
          <FormField control={form.control} name="licenseCopy" render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Lab License (PDF)</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="application/pdf"
                    className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); onChange(f); } }}
                    {...field}
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded-md">
                      <FileText className="w-4 h-4" />
                      <span className="flex-1 truncate">{selectedFile.name}</span>
                      <span className="text-xs">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription className="text-xs">PDF only, max 5MB</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="md:col-span-2 animate-fade-in-up" style={{ animationDelay: "260ms" }}>
          <FormField control={form.control} name="labAddress" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Lab Address</FormLabel>
              <FormControl><Input placeholder="Lab's complete address" className="h-11 bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Password</FormLabel>
              <FormControl><PasswordInput field={field} /></FormControl>
              <FormDescription className="text-xs">8+ chars, uppercase, number & special char</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "340ms" }}>
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Confirm Password</FormLabel>
              <FormControl><PasswordInput field={field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "380ms" }}>
        <Button type="submit" size="lg" disabled={isLoading} className="w-full py-6 shadow-medium hover:shadow-strong transition-all duration-300 group">
          {isLoading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating Account...</>
          ) : (
            <><UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />Create Lab Account</>
          )}
        </Button>
      </div>
    </form>
  );
};

// ── Phlebotomist Form ─────────────────────────────────────────────────────────
const PhlebotomistForm = ({
  form,
  onSubmit,
  isLoading,
}: {
  form: any;
  onSubmit: (data: SignupFormValues) => void;
  isLoading?: boolean;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="animate-fade-in-up" style={{ animationDelay: "60ms" }}>
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><User className="w-4 h-4 text-primary" />Full Name</FormLabel>
              <FormControl><Input placeholder="Muhammad Ahmad" className="h-11 bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />Email</FormLabel>
              <FormControl><Input type="email" placeholder="phlebotomist@example.com" className="h-11 bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "140ms" }}>
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />Phone</FormLabel>
              <FormControl><Input type="tel" placeholder="03XXXXXXXXX" className="h-11 bg-background/60" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "180ms" }}>
          <FormField control={form.control} name="qualification" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" />Qualification</FormLabel>
              <FormControl><Input placeholder="Certified Phlebotomist, MLT, etc." className="h-11 bg-background/60" {...field} /></FormControl>
              <FormDescription className="text-xs">Enter your professional qualification</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="md:col-span-2 animate-fade-in-up" style={{ animationDelay: "220ms" }}>
          <FormField control={form.control} name="trafficLicenseCopy" render={({ field: { onChange, value, ...field } }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" />Traffic License</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); onChange(f); } }}
                    {...field}
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 bg-muted rounded-md">
                      <FileText className="w-4 h-4" />
                      <span className="flex-1 truncate">{selectedFile.name}</span>
                      <span className="text-xs">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription className="text-xs">Image (JPEG, PNG) or PDF, max 5MB</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "260ms" }}>
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Password</FormLabel>
              <FormControl><PasswordInput field={field} /></FormControl>
              <FormDescription className="text-xs">8+ chars, uppercase, number & special char</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Confirm Password</FormLabel>
              <FormControl><PasswordInput field={field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "340ms" }}>
        <Button type="submit" size="lg" disabled={isLoading} className="w-full py-6 shadow-medium hover:shadow-strong transition-all duration-300 group">
          {isLoading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating Account...</>
          ) : (
            <><UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />Create Phlebotomist Account</>
          )}
        </Button>
      </div>
    </form>
  );
};

// ── Role-Based Form Wrapper ───────────────────────────────────────────────────
const RoleBasedForm = ({
  role,
  onBack,
}: {
  role: UserRole;
  onBack: () => void;
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [otp, setOtp] = useState("");

  const getSchema = (role: UserRole) => {
    const baseRefine = (schema: z.ZodObject<any>) =>
      schema.refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });

    switch (role) {
      case "patient":   return baseRefine(patientSchema);
      case "lab":       return baseRefine(labSchema);
      case "phlebotomist": return baseRefine(phlebotomistSchema);
    }
  };

  const getDefaultValues = (role: UserRole) => {
    const base = { role, fullName: "", email: "", phone: "", password: "", confirmPassword: "" };
    switch (role) {
      case "patient":      return { ...base, dateOfBirth: "", age: undefined, address: "" };
      case "lab":          return { ...base, labName: "", licenseCopy: undefined as any, labAddress: "" };
      case "phlebotomist": return { ...base, qualification: "", trafficLicenseCopy: undefined as any };
    }
  };

  const form = useForm<any>({
    resolver: zodResolver(getSchema(role)),
    defaultValues: getDefaultValues(role),
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setIsLoading(true);
      let response;
      if (role === "patient") {
        response = await authAPI.signupPatient({
          fullName: data.fullName, email: data.email, phone: data.phone,
          dateOfBirth: (data as any).dateOfBirth, age: (data as any).age,
          address: (data as any).address, password: data.password,
        });
      } else if (role === "lab") {
        response = await authAPI.signupLab({
          fullName: data.fullName, email: data.email, phone: data.phone,
          labName: (data as any).labName, licenseCopy: (data as any).licenseCopy,
          labAddress: (data as any).labAddress, password: data.password,
        });
      } else if (role === "phlebotomist") {
        response = await authAPI.signupPhlebotomist({
          fullName: data.fullName, email: data.email, phone: data.phone,
          qualification: (data as any).qualification, password: data.password,
          trafficLicenseCopy: (data as any).trafficLicenseCopy,
        });
      }

      if (response && response.success) {
        setSignupEmail(data.email);
        toast({ title: "Success!", description: "OTP sent to your email. Please check your inbox." });
        setShowOTPDialog(true);
      } else {
        toast({ variant: "destructive", title: "Signup Failed", description: response?.message || "Please try again." });
      }
    } catch (error: any) {
      let errorMessage = "Something went wrong. Please try again.";
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        errorMessage = "Cannot connect to server. Make sure backend is running on port 5000.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.verifyOTP(signupEmail, otp, role);
      if (response.success && response.data) {
        storage.setToken(response.data.token);
        toast({ title: "Email Verified!", description: "Your account has been created successfully." });
        navigate(`/${role}`);
      } else {
        toast({ variant: "destructive", title: "Verification Failed", description: response.message || "Invalid OTP. Please try again." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to verify OTP. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (showOTPDialog) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We've sent a 6-digit OTP to <strong>{signupEmail}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Enter OTP</label>
            <Input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="text-center text-3xl tracking-[0.5em] h-14 font-mono bg-background/60"
            />
          </div>

          <Button onClick={handleVerifyOTP} disabled={isLoading || otp.length !== 6} className="w-full" size="lg">
            {isLoading ? "Verifying..." : "Verify & Continue →"}
          </Button>

          <Button variant="ghost" onClick={() => { authAPI.resendOTP(signupEmail, role); toast({ title: "OTP Resent", description: "Please check your email." }); }} disabled={isLoading} className="w-full">
            Resend OTP
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2 hover:bg-primary/10 transition-colors" disabled={isLoading}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Change Role
      </Button>

      <Form {...form}>
        {role === "patient" && <PatientForm form={form} onSubmit={onSubmit} isLoading={isLoading} />}
        {role === "lab" && <LabForm form={form} onSubmit={onSubmit} isLoading={isLoading} />}
        {role === "phlebotomist" && <PhlebotomistForm form={form} onSubmit={onSubmit} isLoading={isLoading} />}
      </Form>
    </>
  );
};

// ── Gradient Panel ─────────────────────────────────────────────────────────────
const SignupGradientPanel = ({ role }: { role: UserRole | null }) => {
  const cfg = role ? roleConfig[role] : null;
  const gradient = cfg?.gradient ?? defaultPanel.gradient;
  const blob1 = cfg?.blobColor1 ?? defaultPanel.blobColor1;
  const blob2 = cfg?.blobColor2 ?? defaultPanel.blobColor2;

  return (
    <div
      className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden animate-slide-in-right transition-all duration-700"
      style={{ background: gradient }}
    >
      {/* Grain overlay */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "200px 200px" }}
      />

      <Blob className={`w-80 h-80 ${blob1} top-0 -right-10`} />
      <Blob className={`w-64 h-64 ${blob2} bottom-10 -left-10`} />
      <Blob className={`w-48 h-48 ${blob1} top-1/2 left-1/2`} />

      {/* Floating icons */}
      <FloatingIcon icon={ShieldCheck} className="top-[12%] left-[15%] w-12 h-12 animate-bounce-gentle" />
      <FloatingIcon icon={Activity} className="top-[30%] right-[12%] w-14 h-14 animate-float" />
      <FloatingIcon icon={cfg?.Icon ?? HeartPulse} className="bottom-[25%] left-[20%] w-12 h-12 animate-float-slow" />

      {/* Content */}
      <div className="relative z-10 text-center px-12 max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-8 shadow-lg">
          <img src={logo} alt="Lab2Home" className="w-12 h-12" />
        </div>

        {cfg ? (
          <>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">{cfg.panelTitle}</h2>
            <p className="text-white/75 text-base mb-8 leading-relaxed">{cfg.panelSub}</p>
            <div className="space-y-3 text-left">
              {cfg.benefits.map((b) => (
                <div key={b} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                  <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${cfg.accentColor}`} />
                  <span className="text-white/90 text-sm font-medium">{b}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              Join <span className="text-white/80">Lab2Home</span> Today
            </h2>
            <p className="text-white/75 text-lg mb-8 leading-relaxed">
              Healthcare at your doorstep — whether you're a patient, diagnostic lab, or phlebotomist.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[{ value: "50K+", label: "Patients" }, { value: "200+", label: "Labs" }, { value: "99%", label: "Accuracy" }].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Signup Page ───────────────────────────────────────────────────────────
const Signup = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const getRoleTitle = (role: UserRole) => {
    switch (role) {
      case "patient": return "Patient";
      case "lab": return "Lab";
      case "phlebotomist": return "Phlebotomist";
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
            Already have an account?
          </span>
          <Link to="/login">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* ── LEFT: Form Panel ──────────────────────────────────────────────── */}
        <div
          className="flex-1 lg:w-1/2 flex items-center justify-center px-6 py-12 bg-background relative overflow-hidden animate-slide-in-left transition-all duration-400"
        >
          {/* Background circles */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="w-full max-w-xl relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-soft mb-6 animate-fade-in">
              <UserPlus className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedRole ? `Create ${getRoleTitle(selectedRole)} Account` : "Create Your Account"}
              </span>
            </div>

            {/* Card */}
            <div className="glass-card rounded-2xl p-8 animate-fade-in-up">
              <h1 className="text-3xl font-bold text-foreground mb-1">
                {selectedRole ? `${getRoleTitle(selectedRole)} Registration` : "Join Lab2Home"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {selectedRole
                  ? `Complete your ${getRoleTitle(selectedRole).toLowerCase()} registration below`
                  : "Start your journey to better health at home"}
              </p>

              {!selectedRole ? (
                <RoleSelection onSelectRole={setSelectedRole} />
              ) : (
                <RoleBasedForm
                  key={selectedRole}
                  role={selectedRole}
                  onBack={() => setSelectedRole(null)}
                />
              )}

              {/* Login link — shown after role is chosen */}
              {selectedRole && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link to="/login" className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors">
                      Sign in →
                    </Link>
                  </p>
                </div>
              )}

              {/* Back to Home */}
              <div className="mt-4 text-center">
                <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to Home
                </Link>
              </div>
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

        {/* ── RIGHT: Gradient Panel (changes per role) ──────────────────────── */}
        <SignupGradientPanel role={selectedRole} />
      </main>

      <Footer />
    </div>
  );
};

export default Signup;
