import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Save, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { getToken } from "@/utils/storage";
import { toast } from "sonner";

interface ProfileData {
  fullName?: string;
  phone?: string;
  address?: string;
  age?: number;
  sex?: string;
  conditions?: string[];
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (data: ProfileData) => void;
  /** When true, highlights the age/sex fields as required */
  requireAgeSex?: boolean;
}

export function EditProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
  requireAgeSex = false,
}: EditProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ProfileData>({});

  // Fetch current profile on open
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      setSaved(false);
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setForm({
          fullName: data.data.fullName || "",
          phone: data.data.phone || "",
          address: data.data.address || "",
          age: data.data.age || undefined,
          sex: data.data.sex || "",
          conditions: data.data.conditions || [],
        });
      }
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (requireAgeSex) {
      if (!form.age || !form.sex) {
        toast.error("Please fill in your age and sex to continue.");
        return;
      }
    }

    try {
      setSaving(true);
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setSaved(true);
        toast.success("Profile updated successfully!");
        onProfileUpdated?.(data.data);
        setTimeout(() => onClose(), 1200);
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Update Profile
          </DialogTitle>
          <DialogDescription>
            {requireAgeSex
              ? "Please add your age and sex to use AI report interpretation."
              : "Update your personal information."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : saved ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-8 gap-3"
          >
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-foreground">Profile updated!</p>
          </motion.div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={form.fullName || ""}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            {/* Age & Sex — highlighted if required */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="age" className={requireAgeSex && !form.age ? "text-destructive" : ""}>
                  Age {requireAgeSex && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={150}
                  value={form.age ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, age: e.target.value ? Number(e.target.value) : undefined })
                  }
                  placeholder="e.g. 25"
                  className={requireAgeSex && !form.age ? "border-destructive" : ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sex" className={requireAgeSex && !form.sex ? "text-destructive" : ""}>
                  Sex {requireAgeSex && <span className="text-destructive">*</span>}
                </Label>
                <Select
                  value={form.sex || ""}
                  onValueChange={(value) => setForm({ ...form, sex: value })}
                >
                  <SelectTrigger
                    id="sex"
                    className={requireAgeSex && !form.sex ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {requireAgeSex && (!form.age || !form.sex) && (
              <p className="text-xs text-destructive">
                Age and sex are required for accurate AI interpretation of your lab results.
              </p>
            )}

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="03XX-XXXXXXX"
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Your address"
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
