import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { phlebotomistService } from "@/services/phlebotomist.service";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AvailabilityToggleProps {
    initialAvailability?: boolean;
    onUpdate?: (availability: boolean) => void;
}

export const AvailabilityToggle = ({ initialAvailability = true, onUpdate }: AvailabilityToggleProps) => {
    const [availability, setAvailability] = useState(initialAvailability);
    const [updating, setUpdating] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setAvailability(initialAvailability);
    }, [initialAvailability]);

    const handleToggle = async (checked: boolean) => {
        try {
            setUpdating(true);
            const response = await phlebotomistService.updateAvailability(checked);

            if (response.success) {
                setAvailability(checked);
                toast({
                    title: "Success",
                    description: `You are now ${checked ? 'available' : 'unavailable'} for collections`,
                });
                onUpdate?.(checked);
            } else {
                toast({
                    title: "Error",
                    description: response.message || "Failed to update availability",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update availability. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Card className="p-4 border-border bg-card shadow-soft">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="availability-toggle" className="text-base font-semibold">
                        Availability Status
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        {availability ? "You are available for collections" : "You are currently unavailable"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {updating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Switch
                        id="availability-toggle"
                        checked={availability}
                        onCheckedChange={handleToggle}
                        disabled={updating}
                    />
                </div>
            </div>
        </Card>
    );
};
