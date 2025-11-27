"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";

export interface SearchableOption {
  id: string;
  name: string;
  description?: string;
}

interface AsyncSearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  fetchOptions: (query: string) => Promise<SearchableOption[]>;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  emptyMessage?: string;
}

export function AsyncSearchableSelect({
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  fetchOptions,
  className,
  disabled = false,
  error = false,
  emptyMessage = "No results found.",
}: AsyncSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SearchableOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOption, setSelectedOption] = useState<SearchableOption | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Find selected option when value changes
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find(opt => opt.id === value);
      setSelectedOption(option || null);
    } else if (!value) {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (searchQuery.trim() || open) {
        setLoading(true);
        try {
          const results = await fetchOptions(searchQuery.trim());
          setOptions(results);
        } catch (error) {
          console.error("Failed to fetch options:", error);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, fetchOptions, open]);

  const handleSelect = (option: SearchableOption) => {
    setSelectedOption(option);
    onValueChange(option.id);
    setOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    onValueChange("");
    setSearchQuery("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && options.length === 0) {
      // Trigger initial load when opening
      setSearchQuery("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 hover:bg-white/60 dark:hover:bg-gray-800/60 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
        >
          <span className={cn(
            "truncate",
            !selectedOption && "text-gray-500 dark:text-gray-400"
          )}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selectedOption && !disabled && (
              // Use a span to avoid nested <button> inside the trigger button
              <span
                role="button"
                aria-label="Clear selection"
                className="inline-flex items-center justify-center h-4 w-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleClear(e);
                }}
              >
                <X className="h-4 w-4" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-700/30">
        <Command>
          <div className="flex items-center border-b border-white/20 dark:border-gray-700/30 px-3">
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus:ring-0 focus:ring-offset-0 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Searching...</span>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => handleSelect(option)}
                  className="cursor-pointer hover:bg-orange-500/10 focus:bg-orange-500/10"
                >
                  <div className="flex items-center w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedOption?.id === option.id ? "opacity-100 text-orange-600" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {option.name}
                      </div>
                      {option.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}