"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { type Country } from "@/lib/hooks/useCountries";
import { useState } from "react";

interface CountrySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  countries: Country[];
  loading: boolean;
  error?: string;
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Select country...",
  className,
  disabled = false,
  countries,
  loading = false,
  error
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);

  const selectedCountry = countries.find((country) => country.name === value);

  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error && countries.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between text-muted-foreground"
          disabled
        >
          Error loading countries
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between cursor-pointer"
            disabled={disabled}
          >
            {selectedCountry ? selectedCountry.name : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 z-[2500]" align="start">
          <Command>
            <CommandInput placeholder="Search countries..." />
            <CommandList>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countries.map((country) => (
                  <CommandItem
                    key={country.code}
                    value={country.name}
                    onSelect={(currentValue) => {
                      const newValue = currentValue === value ? "" : currentValue;
                      onValueChange?.(newValue);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === country.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {country.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
