import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { StatCard } from "@/components/shared/StatCard";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TestTube,
  Clock,
  MapPin,
  Truck,
  HeartPulse,
  Calendar,
  Loader2,
  AlertCircle,
  Star,
  CheckCircle2,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";
import TestBookingForm from "@/components/patient/TestBookingForm";
import { toast } from "sonner";
import { fetchAvailableLabs } from "@/lib/api";

export interface Test {
  _id: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  preparationInstructions?: string;
  reportDeliveryTime: string;
  sampleType?: string;
}

export interface Lab {
  _id: string;
  labName: string;
  labAddress: string;
  rating?: number;
  distance?: string;
  logo?: string;
  availableTests: Test[];
  operatingHours?: {
    open: string;
    close: string;
  };
}

const BookTest: React.FC = () => {
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLabs = async () => {
      try {
        setLoading(true);
        const response = await fetchAvailableLabs();

        if (response.success && response.data) {
          setLabs(response.data);
          console.log(`✅ Loaded ${response.data.length} labs`);
        } else {
          toast.error(response.message || "Failed to load labs");
        }
      } catch (error) {
        console.error("Error fetching labs:", error);
        toast.error("Error loading labs. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadLabs();
  }, []);

  return (
    <DashboardLayout role="patient">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative mb-8 overflow-hidden rounded-2xl gradient-hero p-8"
      >
        <div className="relative z-10">
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/20 border-0">
            <Sparkles className="mr-1 h-3 w-3" />
            Quick & Easy Booking
          </Badge>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Book Your Diagnostic Test
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Choose from certified laboratories near you. Get accurate results with
            home sample collection or visit a lab at your convenience.
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10">
          <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-primary" />
          <div className="absolute right-24 bottom-8 h-20 w-20 rounded-full bg-secondary" />
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Available Tests"
          value="50+"
          icon={TestTube}
          color="primary"
          delay={0}
        />
        <StatCard
          title="Home Collections"
          value="24"
          change="Today"
          trend="up"
          icon={Truck}
          color="success"
          delay={0.1}
        />
        <StatCard
          title="Avg. Report Time"
          value="24 Hours"
          icon={Clock}
          color="warning"
          delay={0.2}
        />
        <StatCard
          title="Nearby Labs"
          value={labs.length.toString()}
          icon={MapPin}
          color="accent"
          delay={0.3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lab selection + Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Select Lab */}
          <Card className="p-6 shadow-card overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                1
              </span>
              <div>
                <h2 className="font-semibold text-lg text-foreground">
                  Select Laboratory
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose a certified lab near you
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Finding labs near you...
                </p>
              </div>
            ) : labs.length === 0 ? (
              <div className="flex items-center gap-3 p-4 border border-warning/30 bg-warning/5 rounded-xl">
                <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
                <p className="text-sm text-warning">
                  No labs are currently available for booking.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {labs.map((lab, index) => (
                  <motion.button
                    key={lab._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedLab(selectedLab?._id === lab._id ? null : lab)}
                    className={`group relative flex w-full flex-col p-4 rounded-xl border text-left transition-all ${selectedLab?._id === lab._id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40 hover:shadow-sm"
                      }`}
                  >
                    {/* Selected Indicator */}
                    {selectedLab?._id === lab._id && (
                      <div className="absolute -right-2 -top-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary shadow-lg">
                          <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0">
                        <TestTube className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {lab.labName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {lab.labAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      {lab.rating && (
                        <span className="flex items-center gap-1 text-xs font-medium text-warning">
                          <Star className="h-3 w-3 fill-warning" />
                          {lab.rating}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {lab.availableTests?.length || 0} Tests
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {lab.operatingHours?.open} - {lab.operatingHours?.close}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </Card>

          {/* Test Booking Form */}
          <Card className="p-6 shadow-card">
            <TestBookingForm selectedLab={selectedLab} />
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Why Home Collection */}
          <Card className="p-6 shadow-card overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-secondary/20 to-transparent rounded-bl-full" />
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10">
                <HeartPulse className="h-4 w-4 text-secondary" />
              </div>
              Why Home Collection?
            </h3>
            <ul className="space-y-3">
              {[
                { icon: Zap, text: "Skip the long queues" },
                { icon: Shield, text: "Safe & hygienic process" },
                { icon: Clock, text: "Quick digital reports" },
                { icon: Star, text: "Certified phlebotomists" },
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
                    <item.icon className="h-3.5 w-3.5 text-foreground" />
                  </span>
                  {item.text}
                </motion.li>
              ))}
            </ul>
          </Card>

          {/* Available Slots */}
          {/* How It Works */}
          <Card className="p-6 shadow-card">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              How It Works
            </h3>
            <div className="relative border-l border-border/50 ml-3 space-y-6 py-2">
              {[
                { title: "Select Lab & Test", desc: "Choose from certified labs near you", active: true },
                { title: "Book a Slot", desc: "Pick a convenient time for collection", active: true },
                { title: "Sample Collection", desc: "Safe home collection or lab visit", active: true },
                { title: "Get Report", desc: "Digital report within 24-48 hours", active: true },
              ].map((step, i) => (
                <div key={i} className="relative pl-6">
                  <span className={`absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full ${step.active ? "bg-primary" : "bg-muted"}`} />
                  <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Trust Badges */}
          <Card className="p-6 shadow-card bg-gradient-to-br from-card to-muted/30">
            <div className="flex items-center gap-4 text-center">
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">98%</p>
                <p className="text-xs text-muted-foreground">Accuracy Rate</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">50K+</p>
                <p className="text-xs text-muted-foreground">Tests Done</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex-1">
                <p className="text-2xl font-bold text-foreground">4.9</p>
                <p className="text-xs text-muted-foreground">User Rating</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default BookTest;
