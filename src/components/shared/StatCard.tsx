// import { LucideIcon } from "lucide-react";
// import { motion } from "framer-motion";
// import { cn } from "@/lib/utils";

// interface StatCardProps {
//   title: string;
//   value: string | number;
//   change?: string;
//   icon: LucideIcon;
//   trend?: "up" | "down" | "neutral";
//   color?: "primary" | "secondary" | "accent" | "success" | "warning";
//   delay?: number;
// }

// export function StatCard({ 
//   title, 
//   value, 
//   change, 
//   icon: Icon, 
//   trend = "neutral",
//   color = "primary",
//   delay = 0 
// }: StatCardProps) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay, duration: 0.4 }}
//       className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:shadow-medium"
//     >
//       {/* Background Gradient Glow */}
//       <div className={cn(
//         "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl transition-opacity opacity-0 group-hover:opacity-20",
//         color === "primary" && "bg-primary",
//         color === "secondary" && "bg-secondary",
//         color === "accent" && "bg-accent",
//         color === "success" && "bg-success",
//         color === "warning" && "bg-warning"
//       )} />

//       <div className="relative flex items-start justify-between">
//         <div className="space-y-2">
//           <p className="text-sm font-medium text-muted-foreground">{title}</p>
//           <p className="text-3xl font-bold text-foreground">{value}</p>
//           {change && (
//             <div className="flex items-center gap-1">
//               <span className={cn(
//                 "text-sm font-medium",
//                 trend === "up" && "text-success",
//                 trend === "down" && "text-destructive",
//                 trend === "neutral" && "text-muted-foreground"
//               )}>
//                 {trend === "up" && "↑"}
//                 {trend === "down" && "↓"}
//                 {change}
//               </span>
//             </div>
//           )}
//         </div>

//         <div className={cn(
//           "flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-110",
//           color === "primary" && "bg-primary/10 text-primary",
//           color === "secondary" && "bg-secondary/10 text-secondary",
//           color === "accent" && "bg-accent/10 text-accent",
//           color === "success" && "bg-success/10 text-success",
//           color === "warning" && "bg-warning/10 text-warning"
//         )}>
//           <Icon className="h-6 w-6" />
//         </div>
//       </div>
//     </motion.div>
//   );
// }

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "secondary" | "success" | "warning" | "accent";
  change?: string;
  trend?: "up" | "down";
  delay?: number;
}

const colorVariants = {
  primary: {
    bg: "bg-primary/10",
    icon: "text-primary",
    gradient: "from-primary/20 to-primary/5",
  },
  secondary: {
    bg: "bg-secondary/10",
    icon: "text-secondary",
    gradient: "from-secondary/20 to-secondary/5",
  },
  success: {
    bg: "bg-success/10",
    icon: "text-success",
    gradient: "from-success/20 to-success/5",
  },
  warning: {
    bg: "bg-warning/10",
    icon: "text-warning",
    gradient: "from-warning/20 to-warning/5",
  },
  accent: {
    bg: "bg-accent/10",
    icon: "text-accent",
    gradient: "from-accent/20 to-accent/5",
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  color = "primary",
  change,
  trend,
  delay = 0,
}) => {
  const variant = colorVariants[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-card transition-all hover:shadow-elevated"
    >
      {/* Gradient Background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100",
          variant.gradient
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </h3>
            {change && trend && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-semibold",
                  trend === "up" ? "text-success" : "text-destructive"
                )}
              >
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {change}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
            variant.bg
          )}
        >
          <Icon className={cn("h-6 w-6", variant.icon)} />
        </div>
      </div>

      {/* Decorative Element */}
      <div
        className={cn(
          "absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-20",
          variant.bg.replace("/10", "")
        )}
      />
    </motion.div>
  );
};
