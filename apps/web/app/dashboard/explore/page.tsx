"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Heart, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { getResponseItems } from "@/lib/api-response";
import type { VisaTypeEntity, CountrySummary } from "@visaflow/shared-types";

export default function ExploreVisasPage() {
  const [visas, setVisas] = useState<VisaTypeEntity[]>([]);
  const [countries, setCountries] = useState<CountrySummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [destCountry, setDestCountry] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/visa-types?limit=100"),
      api.get("/countries/all")
    ]).then(([visaRes, countryRes]) => {
      setVisas(getResponseItems<VisaTypeEntity>(visaRes.data));
      setCountries(getResponseItems<CountrySummary>(countryRes.data));
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const filteredVisas = useMemo(() => {
    return visas.filter((v) => {
      if (destCountry && v.destinationCountryId !== destCountry) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const countryName = (v.destinationCountry?.name || '').toLowerCase();
        const visaName = (v.name || '').toLowerCase();
        if (!visaName.includes(q) && !countryName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [visas, destCountry, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Explore Visas</h1>
        <p className="mt-2 text-slate-500">
          Find the right visa for your travel purpose. Apply with ease, track in real-time.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_1fr] items-start">
        {/* Sidebar Filters */}
        <Card className="sticky top-6">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-slate-900">Filter Visas</h3>
              <button 
                onClick={() => { setDestCountry(""); setSearchQuery(""); }}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700">
                Search
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search visas..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                  />
                </div>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Destination
                <select 
                  value={destCountry}
                  onChange={(e) => setDestCountry(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Destination</option>
                  {countries.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Visa Type
                <select className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>All Types</option>
                </select>
              </label>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Purpose of Travel</h4>
              <div className="space-y-2.5">
                {["Tourism", "Business", "Study", "Work", "Transit", "Other"].map(x => (
                  <label key={x} className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    {x}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500">
              {loading ? "Loading..." : `${filteredVisas.length} visas found`}
            </span>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm">
              <option>Sort by: Popular</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-36 bg-slate-200" />
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVisas.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No visas found</h3>
              <p className="mt-1 text-slate-500 max-w-sm">
                We couldn't find any visas matching your current filters. Try adjusting your search criteria.
              </p>
              <Button 
                variant="outline" 
                onClick={() => { setDestCountry(""); setSearchQuery(""); }}
                className="mt-6"
              >
                Clear all filters
              </Button>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredVisas.map(v => (
                <Card key={v.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200/60">
                  <div className="relative h-40 overflow-hidden bg-slate-100">
                    {/* Placeholder image logic - in reality, would come from DB */}
                    <img 
                      src={`https://source.unsplash.com/600x400/?${encodeURIComponent(v.destinationCountry.name)},landmark`}
                      alt={v.destinationCountry.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <button className="absolute right-3 top-3 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2">
                      <span className="text-2xl drop-shadow-md">{v.destinationCountry?.flagEmoji || '🌍'}</span>
                      <span className="text-white font-semibold text-lg drop-shadow-md truncate">
                        {v.destinationCountry?.name || 'Destination'}
                      </span>
                    </div>
                  </div>
                  
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-slate-900 text-base line-clamp-1" title={v.name}>
                      {v.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {v.entryType} Entry • {v.stayDuration ? `${v.stayDuration} Days` : "Variable"}
                    </p>
                    
                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Processing</p>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          {v.processingDaysMin}-{v.processingDaysMax} days
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">From</p>
                        <p className="mt-1 text-sm font-semibold text-blue-600">
                          ${(v.priceStandard / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    <Button asChild className="w-full mt-5 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-semibold border border-blue-100">
                      <Link href={`/dashboard/explore/visas/${v.slug}`}>
                        View Details
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
