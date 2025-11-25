"use client";

import { useState, useEffect, useCallback } from "react";
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

  const fetchCountries = useCallback(async () => {
    if (disabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let endpoint = source === "restaurants" ? "/restaurants/countries/" : "/influencers/countries/";
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
        setError(null);
      } else {
        setCountries([]);
        setError("No countries found");
      }
    } catch (err) {
      console.error(`Error fetching countries from ${source}:`, err);
      setError("Failed to load countries");
      setCountries([]);
    } finally {
      setLoading(false);
    }
  }, [source, influencerSlug, disabled]);

  useEffect(() => {
    if (!disabled) {
      fetchCountries();
    }
  }, [fetchCountries, disabled]);

  return { countries, loading, error, refetch: fetchCountries };
}
