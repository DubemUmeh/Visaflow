'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useApplicationWizardStore } from '@/store/application.store';

const schema = z.object({
  travelDateFrom:       z.string().min(1, 'Departure date required'),
  travelDateTo:         z.string().min(1, 'Return date required'),
  purposeOfTravel:      z.string().min(3, 'Purpose of travel required'),
  accommodationAddress: z.string().min(5, 'Accommodation address required'),
}).refine(d => new Date(d.travelDateTo) > new Date(d.travelDateFrom), {
  message: 'Return date must be after departure date',
  path: ['travelDateTo'],
});

type FormData = z.infer<typeof schema>;

const purposes = [
  'Tourism / Holiday',
  'Business',
  'Family Visit',
  'Medical Treatment',
  'Education',
  'Conference / Event',
  'Transit',
  'Other',
];

export default function StepTravelDetails() {
  const { updateFormData, nextStep, prevStep, formData } = useApplicationWizardStore();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      travelDateFrom:       formData.travelDateFrom       ?? '',
      travelDateTo:         formData.travelDateTo         ?? '',
      purposeOfTravel:      formData.purposeOfTravel      ?? '',
      accommodationAddress: formData.accommodationAddress ?? '',
    },
  });

  const selectedPurpose = watch('purposeOfTravel');

  const onSubmit = (data: FormData) => {
    updateFormData(data);
    nextStep();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg mb-1">Travel Details</h2>
            <p className="text-sm text-gray-500">Provide information about your intended travel.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Planned Departure Date"
              type="date"
              error={errors.travelDateFrom?.message}
              {...register('travelDateFrom')}
            />
            <Input
              label="Planned Return Date"
              type="date"
              error={errors.travelDateTo?.message}
              {...register('travelDateTo')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Purpose of Travel</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {purposes.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setValue('purposeOfTravel', p)}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                    selectedPurpose === p
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {errors.purposeOfTravel && <p className="text-xs text-red-500 mt-1">{errors.purposeOfTravel.message}</p>}
          </div>

          <Input
            label="Accommodation Address in Destination"
            placeholder="Hotel name, address or host's address"
            leftIcon={<MapPin />}
            hint="Hotel name, Airbnb address, or host's address"
            error={errors.accommodationAddress?.message}
            {...register('accommodationAddress')}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button type="submit" variant="brand" size="lg" className="gap-2">
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}
