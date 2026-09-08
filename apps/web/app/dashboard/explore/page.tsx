"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Heart, Search, SlidersHorizontal, MapPin, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import type { VisaTypeEntity, CountrySummary } from "@visaflow/shared-types";

const PURPOSES = ["Tourism", "Business", "Study", "Work", "Transit", "Other"];

export default function ExploreVisasPage() {
  const [destCountry, setDestCountry] = useState<string>("");
  const [visaType, setVisaType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("popular");

  const visasQuery = useQuery({
    queryKey: ["visa-types"],
    queryFn: async () => {
      const pageSize = 100; // matches server-side max in PaginationDto
      let page = 1;
      let allItems: VisaTypeEntity[] = [];

      while (true) {
        const res = await api.get<any>(
          `/visa-types?limit=${pageSize}&page=${page}`,
        );
        const items = getResponseItems<VisaTypeEntity>(res.data);
        allItems = allItems.concat(items);

        const total = res.data?.meta?.total ?? res.data?.data?.meta?.total;
        // Stop when we've got everything, or when a page comes back short (last page)
        if (items.length < pageSize || (total && allItems.length >= total)) {
          break;
        }
        page++;
      }

      return { data: allItems };
    },
  });

  const countriesQuery = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await api.get<any>("/countries/all");
      return res.data;
    },
  });

  const visas: VisaTypeEntity[] = getResponseItems<VisaTypeEntity>(
    visasQuery.data,
  );
  const countries: CountrySummary[] = getResponseItems<CountrySummary>(
    countriesQuery.data,
  );
  const loading = visasQuery.isLoading || countriesQuery.isLoading;

  // Build the visa-type dropdown options from whatever's actually in the data
  const visaTypeOptions = useMemo(() => {
    const categories = new Set(visas.map((v) => v.category).filter(Boolean));
    return Array.from(categories).sort();
  }, [visas]);

  const CATEGORY_LABELS: Record<string, string> = {
    TOURISM: "Tourism Visa",
    BUSINESS: "Business Visa",
    STUDY: "Student Visa",
    WORK: "Work Visa",
    TRANSIT: "Transit Visa",
    OTHER: "Other",
  };

  const filteredVisas = useMemo(() => {
    const list = visas.filter((v) => {
      if (destCountry && v.destinationCountryId !== destCountry) return false;
      if (visaType !== "all" && v.category !== visaType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const countryName = (v.destinationCountry?.name || "").toLowerCase();
        const visaName = (v.name || "").toLowerCase();
        if (!visaName.includes(q) && !countryName.includes(q)) return false;
      }
      return true;
    });
    if (sort === "price-asc")
      return [...list].sort((a, b) => a.priceStandard - b.priceStandard);
    if (sort === "price-desc")
      return [...list].sort((a, b) => b.priceStandard - a.priceStandard);
    return list;
  }, [visas, destCountry, visaType, searchQuery, sort]);

  const hasActiveFilters = Boolean(
    destCountry || searchQuery || visaType !== "all",
  );

  const clearFilters = () => {
    setDestCountry("");
    setVisaType("all");
    setSearchQuery("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-14">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          Explore visas
        </h1>
        <p className="max-w-xl text-slate-500">
          Find the right visa for your trip. Compare requirements, processing
          time, and cost before you apply.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[272px_1fr] xl:items-start">
        {/* Sidebar filters */}
        <Card className="sticky top-6 gap-0 border-slate-200/80 py-0 shadow-sm">
          <CardContent className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Filters
                </h3>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-auto px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="visa-search"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Search
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="visa-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search visas or countries…"
                    className="bg-slate-50 pl-9"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Destination
                </Label>
                <Select
                  value={destCountry || "any"}
                  onValueChange={(v) => setDestCountry(v === "any" ? "" : v)}
                >
                  <SelectTrigger className="w-full bg-slate-50">
                    <SelectValue placeholder="Any destination" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any destination</SelectItem>
                    {countries.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Visa type
                </Label>
                <Select value={visaType} onValueChange={setVisaType}>
                  <SelectTrigger className="w-full bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {visaTypeOptions.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator className="my-5" />

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Purpose of travel
              </p>
              <div className="space-y-3">
                {PURPOSES.map((purpose) => (
                  <div key={purpose} className="flex items-center gap-2.5">
                    <Checkbox id={`purpose-${purpose}`} />
                    <Label
                      htmlFor={`purpose-${purpose}`}
                      className="cursor-pointer text-sm font-normal text-slate-600"
                    >
                      {purpose}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-500">
              {loading
                ? "Loading visas…"
                : `${filteredVisas.length} visa${filteredVisas.length === 1 ? "" : "s"} found`}
            </span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-50 bg-white shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Sort by: Popular</SelectItem>
                <SelectItem value="price-asc">Price: Low to high</SelectItem>
                <SelectItem value="price-desc">Price: High to low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden py-0 gap-0">
                  <Skeleton className="h-40 w-full rounded-none" />
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVisas.length === 0 ? (
            <Card className="border-dashed border-slate-300 bg-slate-50/50 shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <MapPin className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  No visas found
                </h3>
                <p className="mt-1 max-w-sm text-slate-500">
                  We couldn't find any visas matching your filters. Try
                  adjusting your search or destination.
                </p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-6"
                >
                  Clear all filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredVisas.map((v) => (
                <Card
                  key={v.id}
                  className="group overflow-hidden gap-0 border-slate-200/70 py-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    <img
                      src={`https://source.unsplash.com/600x400/?${encodeURIComponent(v.destinationCountry?.name || "travel")},landmark`}
                      alt={v.destinationCountry?.name || "Visa destination"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                    <button
                      className="absolute right-3 top-3 rounded-full bg-black/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
                      aria-label="Save visa"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                      <span className="text-2xl drop-shadow-md">
                        {v.destinationCountry?.flagEmoji || "🌍"}
                      </span>
                      <span className="truncate text-lg font-semibold text-white drop-shadow-md">
                        {v.destinationCountry?.name || "Destination"}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-5">
                    <h3
                      className="line-clamp-1 text-base font-semibold text-slate-900"
                      title={v.name}
                    >
                      {v.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {v.entryType} entry ·{" "}
                      {v.stayDuration ? `${v.stayDuration} days` : "Variable"}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                          Processing
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {v.processingDaysMin}–{v.processingDaysMax} days
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                          From
                        </p>
                        <p className="mt-1 text-sm font-semibold text-blue-600">
                          ${(v.priceStandard / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="mt-5 w-full border border-blue-100 bg-blue-50 font-semibold text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    >
                      <Link href={`/dashboard/explore/visas/${v.slug}`}>
                        View details
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
