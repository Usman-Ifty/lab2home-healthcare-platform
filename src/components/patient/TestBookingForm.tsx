import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { z } from "zod";
import {
  CalendarIcon,
  Clock,
  MapPin,
  Home,
  Building2,
  Search,
  CheckCircle2,
  Loader2,
  Navigation,
  CreditCard,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";
import { createBooking } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface Lab {
  _id: string;
  labName: string;
  availableTests?: Array<{
    _id: string;
    name: string;
    description: string;
    basePrice: number;
    reportDeliveryTime: string;
    sampleType?: string;
    preparationInstructions?: string;
  }>;
}

interface TestBookingFormProps {
  selectedLab: Lab | null;
}

// Address validation schema - Pakistani format
const addressSchema = z.object({
  fullAddress: z.string().trim().min(10, "Please enter a complete address").max(200, "Address too long"),
  landmark: z.string().trim().max(100, "Landmark too long").optional(),
  city: z.string().trim().min(2, "City is required").max(50, "City name too long"),
  state: z.string().trim().min(2, "Province is required").max(50, "Province name too long"),
  pincode: z.string().trim().regex(/^[0-9]{5}$/, "Enter valid 5-digit postal code"),
  contactPhone: z.string().trim().regex(/^(03|\+923)[0-9]{9}$/, "Enter valid Pakistani mobile number (03XXXXXXXXX)"),
});

const timeSlots = [
  { time: "08:00 AM - 10:00 AM", available: true },
  { time: "10:00 AM - 12:00 PM", available: true },
  { time: "12:00 PM - 02:00 PM", available: false },
  { time: "02:00 PM - 04:00 PM", available: true },
  { time: "04:00 PM - 06:00 PM", available: true },
  { time: "06:00 PM - 08:00 PM", available: true },
];

const TestBookingForm: React.FC<TestBookingFormProps> = ({ selectedLab }) => {
  const { user } = useAuth();
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [collectionType, setCollectionType] = useState<"home" | "lab">("home");
  const [date, setDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Address form state
  const [address, setAddress] = useState({
    fullAddress: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    contactPhone: "",
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const availableTests = selectedLab?.availableTests || [];

  // Fetch available time slots when lab or date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedLab?._id || !date) {
        setAvailableTimeSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const apiUrl = API_BASE_URL;
        const response = await fetch(
          `${apiUrl}/labs/${selectedLab._id}/available-slots?date=${formattedDate}`
        );
        const data = await response.json();

        if (data.success) {
          setAvailableTimeSlots(data.data.availableSlots || []);
        } else {
          toast.error('Failed to load available time slots');
          setAvailableTimeSlots([]);
        }
      } catch (error) {
        console.error('Error fetching time slots:', error);
        toast.error('Failed to load time slots');
        setAvailableTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [selectedLab?._id, date]);

  const filteredTests = availableTests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPrice = availableTests
    .filter((test) => selectedTests.includes(test._id))
    .reduce((sum, test) => sum + test.basePrice, 0);

  const handleTestToggle = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    );
  };

  const handleAddressChange = (field: string, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (addressErrors[field]) {
      setAddressErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateAddress = (): boolean => {
    if (collectionType !== "home") return true;

    const result = addressSchema.safeParse(address);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setAddressErrors(errors);
      return false;
    }
    setAddressErrors({});
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please login to book a test");
      return;
    }
    if (selectedTests.length === 0) {
      toast.error("Please select at least one test");
      return;
    }
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    if (!selectedTime) {
      toast.error("Please select a time slot");
      return;
    }
    if (!validateAddress()) {
      toast.error("Please fill in all address details correctly");
      return;
    }

    setIsSubmitting(true);
    try {
      const collectionAddress = collectionType === "home"
        ? `${address.fullAddress}, ${address.landmark ? address.landmark + ', ' : ''}${address.city}, ${address.state} - ${address.pincode}. Contact: ${address.contactPhone}`
        : undefined;

      const bookingData = {
        patient: user.id,
        lab: selectedLab!._id,
        tests: selectedTests,
        bookingDate: format(date, "yyyy-MM-dd"),
        preferredTimeSlot: selectedTime,
        collectionType,
        collectionAddress,
        paymentMethod,
      };

      console.log('📤 Creating booking:', bookingData);
      const response = await createBooking(bookingData);

      if (response.success) {
        if (paymentMethod === 'online' && response.data.paymentData) {
          toast.info('Redirecting to secure payment gateway...');

          const paymentData = response.data.paymentData;
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = paymentData.action_url;

          Object.keys(paymentData).forEach(key => {
            if (key !== 'action_url') {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = paymentData[key];
              form.appendChild(input);
            }
          });

          document.body.appendChild(form);
          form.submit();
          return;
        }

        toast.success("Booking confirmed! Lab has been notified.");
        // Reset form
        setSelectedTests([]);
        setDate(undefined);
        setSelectedTime("");
        setAddress({
          fullAddress: "",
          landmark: "",
          city: "",
          state: "",
          pincode: "",
          contactPhone: "",
        });
      } else {
        toast.error(response.message || "Failed to create booking");
      }
    } catch (error) {
      console.error('❌ Booking error:', error);
      toast.error("An error occurred while booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedLab) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Select a Laboratory</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Please select a laboratory from above to view available tests and book your appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Step 2: Select Tests */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            2
          </span>
          Select Tests
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
            maxLength={100}
          />
        </div>

        {/* Tests Grid */}
        <div className="grid gap-3 max-h-64 overflow-y-auto pr-2">
          <AnimatePresence>
            {filteredTests.map((test, index) => (
              <motion.div
                key={test._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleTestToggle(test._id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all",
                  selectedTests.includes(test._id)
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                <Checkbox
                  checked={selectedTests.includes(test._id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{test.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {test.description}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary whitespace-nowrap">
                      Rs. {test.basePrice}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {test.reportDeliveryTime}
                    </span>
                    {test.sampleType && (
                      <span className="px-2 py-0.5 bg-muted rounded-full">
                        {test.sampleType}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {selectedTests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 p-4"
          >
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedTests.length} test{selectedTests.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-lg font-bold text-foreground">Rs. {totalPrice}</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </motion.div>
        )}
      </div>

      {/* Step 3: Collection Type */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            3
          </span>
          Collection Type
        </h2>

        <RadioGroup
          value={collectionType}
          onValueChange={(val) => setCollectionType(val as "home" | "lab")}
          className="grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="home"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
              collectionType === "home"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <RadioGroupItem value="home" id="home" />
            <Home className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Home Collection</p>
              <p className="text-xs text-muted-foreground">We'll come to you</p>
            </div>
          </Label>
          <Label
            htmlFor="lab"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
              collectionType === "lab"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <RadioGroupItem value="lab" id="lab" />
            <Building2 className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Visit Lab</p>
              <p className="text-xs text-muted-foreground">Walk-in appointment</p>
            </div>
          </Label>
        </RadioGroup>

        {/* Address Details - Show when Home Collection is selected */}
        <AnimatePresence>
          {collectionType === "home" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 overflow-hidden"
            >
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Navigation className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Collection Address</h3>
                    <p className="text-xs text-muted-foreground">Where should we collect the sample?</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  {/* Full Address */}
                  <div className="space-y-2">
                    <Label htmlFor="fullAddress" className="text-sm font-medium">
                      Full Address <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="fullAddress"
                      placeholder="House/Flat No., Street, Sector, Area (e.g., House 123, Street 5, F-7)"
                      value={address.fullAddress}
                      onChange={(e) => handleAddressChange("fullAddress", e.target.value)}
                      className={cn(
                        "rounded-xl resize-none min-h-[80px]",
                        addressErrors.fullAddress && "border-destructive focus-visible:ring-destructive"
                      )}
                      maxLength={200}
                    />
                    {addressErrors.fullAddress && (
                      <p className="text-xs text-destructive">{addressErrors.fullAddress}</p>
                    )}
                  </div>

                  {/* Landmark */}
                  <div className="space-y-2">
                    <Label htmlFor="landmark" className="text-sm font-medium">
                      Landmark <span className="text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="landmark"
                      placeholder="Near mosque, hospital, market, etc."
                      value={address.landmark}
                      onChange={(e) => handleAddressChange("landmark", e.target.value)}
                      className="rounded-xl"
                      maxLength={100}
                    />
                  </div>

                  {/* City & State */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">
                        City <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="city"
                        placeholder="Karachi"
                        value={address.city}
                        onChange={(e) => handleAddressChange("city", e.target.value)}
                        className={cn(
                          "rounded-xl",
                          addressErrors.city && "border-destructive focus-visible:ring-destructive"
                        )}
                        maxLength={50}
                      />
                      {addressErrors.city && (
                        <p className="text-xs text-destructive">{addressErrors.city}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">
                        Province <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="state"
                        placeholder="Sindh"
                        value={address.state}
                        onChange={(e) => handleAddressChange("state", e.target.value)}
                        className={cn(
                          "rounded-xl",
                          addressErrors.state && "border-destructive focus-visible:ring-destructive"
                        )}
                        maxLength={50}
                      />
                      {addressErrors.state && (
                        <p className="text-xs text-destructive">{addressErrors.state}</p>
                      )}
                    </div>
                  </div>

                  {/* Pincode & Phone */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pincode" className="text-sm font-medium">
                        Postal Code <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="pincode"
                        placeholder="75500"
                        value={address.pincode}
                        onChange={(e) => handleAddressChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                        className={cn(
                          "rounded-xl",
                          addressErrors.pincode && "border-destructive focus-visible:ring-destructive"
                        )}
                        maxLength={5}
                      />
                      {addressErrors.pincode && (
                        <p className="text-xs text-destructive">{addressErrors.pincode}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone" className="text-sm font-medium">
                        Contact Number <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="contactPhone"
                        placeholder="03001234567"
                        value={address.contactPhone}
                        onChange={(e) => handleAddressChange("contactPhone", e.target.value.replace(/\D/g, "").slice(0, 11))}
                        className={cn(
                          "rounded-xl",
                          addressErrors.contactPhone && "border-destructive focus-visible:ring-destructive"
                        )}
                        maxLength={11}
                      />
                      {addressErrors.contactPhone && (
                        <p className="text-xs text-destructive">{addressErrors.contactPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 4: Date & Time */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            4
          </span>
          Select Date & Time
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-xl h-12",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Time Slots */}
          <div className="grid grid-cols-2 gap-2">
            {loadingSlots ? (
              <div className="col-span-2 text-center py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                <p className="text-xs mt-2">Loading available slots...</p>
              </div>
            ) : !date ? (
              <div className="col-span-2 text-center py-4 text-muted-foreground text-xs">
                Please select a date first
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="col-span-2 text-center py-4 text-muted-foreground text-xs">
                No available slots for this date
              </div>
            ) : (
              availableTimeSlots.map((slotTime) => (
                <button
                  key={slotTime}
                  onClick={() => setSelectedTime(slotTime)}
                  className={cn(
                    "rounded-lg px-2 py-2 text-xs font-medium transition-all",
                    selectedTime === slotTime
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-primary/10 text-foreground"
                  )}
                >
                  {slotTime}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Step 5: Payment Method */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            5
          </span>
          Payment Method
        </h2>

        <RadioGroup
          value={paymentMethod}
          onValueChange={(val) => setPaymentMethod(val as "cash" | "online")}
          className="grid grid-cols-2 gap-4"
        >
          <Label
            htmlFor="cash"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
              paymentMethod === "cash"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <RadioGroupItem value="cash" id="cash" />
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">Cash at Lab</p>
              <p className="text-xs text-muted-foreground">Pay when you visit</p>
            </div>
          </Label>
          <Label
            htmlFor="online"
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all",
              paymentMethod === "online"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            )}
          >
            <RadioGroupItem value="online" id="online" />
            <CreditCard className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Online Payment</p>
              <p className="text-xs text-muted-foreground">Pay via PayFast</p>
            </div>
          </Label>
        </RadioGroup>
      </div>

      {/* Submit */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pt-4 border-t border-border"
      >
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedTests.length === 0}
          className="w-full h-12 rounded-xl text-base font-semibold gradient-primary hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Confirm Booking • Rs. {totalPrice}
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-3">
          By booking, you agree to our terms and conditions
        </p>
      </motion.div>
    </div>
  );
};

export default TestBookingForm;
