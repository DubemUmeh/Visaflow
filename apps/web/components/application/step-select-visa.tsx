'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Search, ChevronRight, Globe, Zap, Rocket } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useApplicationWizardStore } from '@/store/application.store';
import api from '@/lib/api';
import { getResponseItems } from '@/lib/api-response';
import { cn } from '@/lib/utils';
import type { CountrySummary, VisaTypeSummary } from '@visaflow/shared-types';

const schema = z.object({
  destinationCountryId: z.string().min(1, 'Select a destination'),
  nationalityCountryId: z.string().min(1, 'Select your nationality'),
  visaTypeId: z.string().min(1, 'Select a visa type'),
  processingTier: z.enum(['STANDARD', 'EXPEDITED', 'RUSH']),
});

type FormData = z.infer<typeof schema>;

const tierInfo = [
  { value: 'STANDARD',  label: 'Standard',  icon: Globe,  desc: '5–10 business days', color: 'blue'   },
  { value: 'EXPEDITED', label: 'Expedited', icon: Zap,    desc: '2–3 business days',  color: 'yellow' },
  { value: 'RUSH',      label: 'Rush',      icon: Rocket, desc: '24–48 hours',        color: 'red'    },
];

export default function StepSelectVisa() {
  const { updateFormData, nextStep, formData } = useApplicationWizardStore();
  const [countries, setCountries] = useState<CountrySummary[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaTypeSummary[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingVisas, setLoadingVisas] = useState(false);
  const [destSearch, setDestSearch] = useState('');
  const [natSearch, setNatSearch] = useState('');
  const [selectedDest, setSelectedDest] = useState<CountrySummary | null>(null);
  const [selectedNat, setSelectedNat] = useState<CountrySummary | null>(null);

  const { setValue, watch, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      destinationCountryId: formData.destinationCountryId ?? '',
      nationalityCountryId: formData.nationalityCountryId ?? '',
      visaTypeId: formData.visaTypeId ?? '',
      processingTier: formData.processingTier ?? 'STANDARD',
    },
  });

  const processingTier = watch('processingTier');
  const visaTypeId = watch('visaTypeId');

  useEffect(() => {
    api.get('/countries/all').then(({ data }) => {
      setCountries(getResponseItems<CountrySummary>(data));
    }).catch(() => {
      setCountries([]);
    }).finally(() => setLoadingCountries(false));
  }, []);

  useEffect(() => {
    const dest = watch('destinationCountryId');
    const nat = watch('nationalityCountryId');
    if (dest && nat) {
      setLoadingVisas(true);
      api.get(`/visa-types?destinationCountryId=${dest}&nationalityCountryId=${nat}`)
        .then(({ data }) => setVisaTypes(getResponseItems<VisaTypeSummary>(data.data)))
        .catch(() => setVisaTypes([]))
        .finally(() => setLoadingVisas(false));
    }
  }, [watch('destinationCountryId'), watch('nationalityCountryId')]);

  const filteredDest = countries.filter((c) =>
    c.name.toLowerCase().includes(destSearch.toLowerCase())
  ).slice(0, 8);

  const filteredNat = countries.filter((c) =>
    c.name.toLowerCase().includes(natSearch.toLowerCase())
  ).slice(0, 8);

  const destResults = destSearch ? filteredDest : countries.slice(0, 8);
  const natResults = natSearch ? filteredNat : countries.slice(0, 8);

  const onSubmit = (data: FormData) => {
    updateFormData(data);
    nextStep();
  };

  const selectDest = (c: CountrySummary) => {
    setSelectedDest(c);
    setValue('destinationCountryId', c.id);
    setValue('visaTypeId', '');
    setDestSearch('');
  };

  const selectNat = (c: CountrySummary) => {
    setSelectedNat(c);
    setValue('nationalityCountryId', c.id);
    setValue('visaTypeId', '');
    setNatSearch('');
  };

  useEffect(() => {
    if (!loadingCountries && countries.length > 0) {
      if (!selectedDest && formData.destinationCountryId) {
        const existingDest = countries.find((c) => c.id === formData.destinationCountryId);
        if (existingDest) setSelectedDest(existingDest);
      }
      if (!selectedNat && formData.nationalityCountryId) {
        const existingNat = countries.find((c) => c.id === formData.nationalityCountryId);
        if (existingNat) setSelectedNat(existingNat);
      }
    }
  }, [loadingCountries, countries, formData.destinationCountryId, formData.nationalityCountryId, selectedDest, selectedNat]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Destination */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">1. Select Destination Country</h2>
          {selectedDest ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-3">
              <span className="text-2xl">{selectedDest.flagEmoji}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{selectedDest.name}</p>
                <p className="text-xs text-gray-500">{selectedDest.visaTypesCount} visa types available</p>
              </div>
              <button type="button" onClick={() => { setSelectedDest(null); setValue('destinationCountryId', ''); }}
                className="text-xs text-blue-600 hover:text-blue-700">Change</button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={destSearch}
                onChange={e => setDestSearch(e.target.value)}
                placeholder="Search destination country..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(!loadingCountries && destResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {destResults.map(c => (
                    <button key={c.id} type="button" onClick={() => selectDest(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <span className="text-xl">{c.flagEmoji}</span>
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {!loadingCountries && destResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4 text-sm text-gray-500">
                  No countries found. Try typing a different destination.
                </div>
              )}
              {loadingCountries && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4 text-sm text-gray-500">
                  Loading countries...
                </div>
              )}
            </div>
          )}
          {errors.destinationCountryId && <p className="text-xs text-red-500 mt-1">{errors.destinationCountryId.message}</p>}
        </CardContent>
      </Card>

      {/* Nationality */}
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">2. Select Your Nationality</h2>
          {selectedNat ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl mb-3">
              <span className="text-2xl">{selectedNat.flagEmoji}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{selectedNat.name}</p>
              </div>
              <button type="button" onClick={() => { setSelectedNat(null); setValue('nationalityCountryId', ''); }}
                className="text-xs text-blue-600 hover:text-blue-700">Change</button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={natSearch}
                onChange={e => setNatSearch(e.target.value)}
                placeholder="Search your nationality..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {(!loadingCountries && natResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {natResults.map(c => (
                    <button key={c.id} type="button" onClick={() => selectNat(c)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                      <span className="text-xl">{c.flagEmoji}</span>
                      <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {!loadingCountries && natResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4 text-sm text-gray-500">
                  No countries found. Try typing your nationality.
                </div>
              )}
              {loadingCountries && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 p-4 text-sm text-gray-500">
                  Loading countries...
                </div>
              )}
            </div>
          )}
          {errors.nationalityCountryId && <p className="text-xs text-red-500 mt-1">{errors.nationalityCountryId.message}</p>}
        </CardContent>
      </Card>

      {/* Visa Types */}
      {selectedDest && selectedNat && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">3. Select Visa Type</h2>
            {loadingVisas ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : visaTypes.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No visa types available for this combination.
              </p>
            ) : (
              <div className="space-y-3">
                {visaTypes.map(vt => (
                  <button
                    key={vt.id}
                    type="button"
                    onClick={() => setValue('visaTypeId', vt.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                      visaTypeId === vt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className={cn('w-3 h-3 rounded-full shrink-0', visaTypeId === vt.id ? 'bg-blue-600' : 'bg-gray-300')} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{vt.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {vt.entryType} entry · {vt.stayDuration ? `${vt.stayDuration} day stay` : 'Variable stay'} ·
                        {vt.processingDaysMin}–{vt.processingDaysMax} business days
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">${(vt.priceStandard / 100).toFixed(2)}</p>
                      <p className="text-xs text-gray-400">from</p>
                    </div>
                    {visaTypeId === vt.id && <ChevronRight className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>
            )}
            {errors.visaTypeId && <p className="text-xs text-red-500 mt-2">{errors.visaTypeId.message}</p>}
          </CardContent>
        </Card>
      )}

      {/* Processing Tier */}
      {visaTypeId && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4">4. Processing Speed</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {tierInfo.map(tier => (
                <button
                  key={tier.value}
                  type="button"
                  onClick={() => setValue('processingTier', tier.value as 'STANDARD' | 'EXPEDITED' | 'RUSH')}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all text-left',
                    processingTier === tier.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <tier.icon className={cn('w-5 h-5 mb-2',
                    tier.color === 'blue' ? 'text-blue-600' : tier.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  )} />
                  <p className="font-semibold text-gray-900 text-sm">{tier.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{tier.desc}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" variant="brand" size="lg" className="gap-2">
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
