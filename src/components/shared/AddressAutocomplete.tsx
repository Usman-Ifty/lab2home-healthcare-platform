import React from "react";
import usePlacesAutocomplete, {
    getGeocode,
    getLatLng,
} from "use-places-autocomplete";
import {
    Command,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AddressAutocompleteProps {
    onSelect: (address: string, lat?: number, lng?: number) => void;
    defaultValue?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
    onSelect,
    defaultValue = "",
}) => {
    const {
        ready,
        value,
        setValue,
        suggestions: { status, data },
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            /* Define search scope here */
        },
        debounce: 300,
        defaultValue,
    });

    const [loadingLocation, setLoadingLocation] = React.useState(false);

    const handleSelect = async (address: string) => {
        setValue(address, false);
        clearSuggestions();

        try {
            const results = await getGeocode({ address });
            const { lat, lng } = await getLatLng(results[0]);
            onSelect(address, lat, lng);
        } catch (error) {
            console.error("Error: ", error);
            toast.error("Failed to get location details");
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setLoadingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
                    );
                    const data = await response.json();

                    if (data.results && data.results[0]) {
                        const address = data.results[0].formatted_address;
                        setValue(address, false);
                        onSelect(address, latitude, longitude);
                        toast.success("Location fetched successfully");
                    } else {
                        toast.error("Could not find address for your location");
                    }
                } catch (error) {
                    console.error("Error fetching address:", error);
                    toast.error("Failed to fetch address");
                } finally {
                    setLoadingLocation(false);
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
                toast.error("Failed to get current location");
                setLoadingLocation(false);
            }
        );
    };

    return (
        <div className="space-y-2">
            <div className="relative">
                <Command className="rounded-lg border shadow-md">
                    <CommandInput
                        placeholder="Search your address..."
                        value={value}
                        onValueChange={(val) => {
                            setValue(val);
                            onSelect(val);
                        }}
                        disabled={!ready}
                    />
                    {status === "OK" && (
                        <CommandList className="absolute top-full z-10 w-full bg-popover text-popover-foreground shadow-md rounded-b-lg border-x border-b">
                            <CommandGroup>
                                {data.map(({ place_id, description }) => (
                                    <CommandItem
                                        key={place_id}
                                        value={description}
                                        onSelect={handleSelect}
                                        className="cursor-pointer"
                                    >
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {description}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    )}
                </Command>
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleCurrentLocation}
                disabled={loadingLocation}
            >
                {loadingLocation ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting location...
                    </>
                ) : (
                    <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Use Current Location
                    </>
                )}
            </Button>
        </div>
    );
};

export default AddressAutocomplete;
