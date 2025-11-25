"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
type ApiItem = { code?: string; iso2?: string; name?: string; country?: string } | string;

export interface Country {
  code: string;
  name: string;
}

export type CountriesSource = "influencers" | "restaurants";

export function useCountries(source: CountriesSource = "influencers", influencerSlug?: string, disabled: boolean = false) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(!disabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetching if disabled
    if (disabled) {
      setLoading(false);
      return;
    }

    const fetchCountries = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let endpoint = source === "restaurants" ? "/restaurants/countries/" : "/influencers/countries/";
        
        // Add influencer_slug parameter for restaurant countries if provided
        if (source === "restaurants" && influencerSlug) {
          endpoint += `?influencer=${influencerSlug}`;
        }
        
        const response = await api.get(endpoint);
        const data: unknown = response.data;
        let list: ApiItem[] = [];
        if (Array.isArray(data)) {
          list = data as ApiItem[];
        } else if (data && typeof data === "object") {
          const obj = data as Record<string, unknown>;
          if (Array.isArray(obj.countries)) list = obj.countries as ApiItem[];
          else if (Array.isArray(obj.country)) list = obj.country as ApiItem[];
          else if (Array.isArray(obj.results)) list = obj.results as ApiItem[];
        }
        const normalized: Country[] = list.map((item) => {
          if (typeof item === "string") return { code: "", name: item };
          const code = (item.code || item.iso2 || "");
          const name = (item.name || item.country || "");
          return { code, name };
        });
        if (normalized.length > 0) {
          setCountries(normalized);
        }
      } catch (err) {
        console.error(`Error fetching countries from ${source}:`, err);
        setError("Failed to load countries");
        
        // Fallback to static countries list if API fails
        const fallbackCountries: Country[] = [
          { code: "US", name: "United States" },
          { code: "CA", name: "Canada" },
          { code: "GB", name: "United Kingdom" },
          { code: "AU", name: "Australia" },
          { code: "DE", name: "Germany" },
          { code: "FR", name: "France" },
          { code: "IT", name: "Italy" },
          { code: "ES", name: "Spain" },
          { code: "JP", name: "Japan" },
          { code: "KR", name: "South Korea" },
          { code: "IN", name: "India" },
          { code: "BR", name: "Brazil" },
          { code: "MX", name: "Mexico" },
          { code: "TH", name: "Thailand" },
          { code: "VN", name: "Vietnam" },
        ];
        setCountries(fallbackCountries);
      } finally {
        setLoading(false);
      }
    };

    fetchCountries();
  }, [source, influencerSlug, disabled]);

  return { countries, loading, error };
}
