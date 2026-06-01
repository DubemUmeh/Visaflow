'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Globe, Loader2, CheckCircle2, XCircle, Plus, Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import { toast } from 'sonner';

interface Country {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
  isActive: boolean;
  visaTypesCount?: number;
  processingDays?: number;
}

export default function AdminCountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const fetchCountries = () => {
    api.get('/countries?limit=200').then(({ data }) => {
      setCountries(getResponseItems<Country & { isPublished?: boolean }>(data.data).map(country => ({
        ...country,
        isActive: country.isActive ?? country.isPublished ?? true,
      })));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCountries(); }, []);

  const toggleActive = async (id: string, current: boolean) => {
    setToggling(p => ({ ...p, [id]: true }));
    try {
      await api.patch(`/countries/${id}`, { isPublished: !current });
      setCountries(prev => prev.map(c => c.id === id ? { ...c, isActive: !current } : c));
      toast.success(`Country ${!current ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update country.');
    } finally {
      setToggling(p => ({ ...p, [id]: false }));
    }
  };

  const filtered = countries.filter(c =>
    `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = countries.filter(c => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Countries</h1>
          <p className="text-gray-500 mt-1">{activeCount} active · {countries.length} total</p>
        </div>
        <Button variant="brand" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Country
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search countries..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Country', 'Code', 'Visa Types', 'Avg. Processing', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      <Globe className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      No countries found
                    </td>
                  </tr>
                ) : filtered.map((country, i) => (
                  <motion.tr
                    key={country.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.flagEmoji}</span>
                        <span className="font-medium text-gray-900">{country.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{country.code}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {country.visaTypesCount ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {country.processingDays ? `${country.processingDays} days` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={country.isActive ? 'success' : 'secondary'} className="gap-1 text-xs">
                        {country.isActive
                          ? <><CheckCircle2 className="w-3 h-3" />Active</>
                          : <><XCircle className="w-3 h-3" />Inactive</>
                        }
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 text-xs ${country.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                          onClick={() => toggleActive(country.id, country.isActive)}
                          disabled={toggling[country.id]}
                        >
                          {toggling[country.id]
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : country.isActive ? 'Disable' : 'Enable'
                          }
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
