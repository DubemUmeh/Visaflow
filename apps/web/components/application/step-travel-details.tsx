'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useApplicationWizardStore } from '@/store/application.store';
import api from '@/lib/api';
import { toast } from 'sonner';

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
  const {
    updateFormData,
    nextStep,
    prevStep,
    formData,
    applicationId,
    setApplicationId,
    isSaving,
    setSaving,
  } = useApplicationWizardStore();

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

  const onSubmit = async (data: FormData) => {
    if (isSaving) return; // guard against duplicate submissions

    try {
      setSaving(true);

      // Only create the draft once. If applicationId already exists
      if (!applicationId) {
        const payload = {
          // Step 1 data
          visaTypeId: formData.visaTypeId,
          destinationCountryId: formData.destinationCountryId,
          nationalityCountryId: formData.nationalityCountryId,
          processingTier: formData.processingTier ?? 'STANDARD',

          // Step 2 data
          applicantFirstName: formData.applicantFirstName,
          applicantLastName: formData.applicantLastName,
          applicantEmail: formData.applicantEmail,
          applicantPhone: formData.applicantPhone,
          applicantDob: formData.applicantDob,
          applicantPassportNo: formData.applicantPassportNo,
          applicantPassportExpiry: formData.applicantPassportExpiry,

          // Step 3 data (from this submit)
          travelDateFrom: data.travelDateFrom,
          travelDateTo: data.travelDateTo,

          formData: {
            purposeOfTravel: data.purposeOfTravel,
            accommodationAddress: data.accommodationAddress,
          },
        };

        const response = await api.post('/applications', payload);
        const application = response.data.data ?? response.data;

        if (!application?.id) {
          throw new Error('Application ID was not returned');
        }

        setApplicationId(application.id);
      }

      // Persist Step 3 fields locally regardless of branch above
      updateFormData(data);

      // Only advance once the draft is confirmed to exist
      nextStep();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        'Could not save your application draft. Please try again.';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
      // Do NOT call nextStep(). user stays on Step 3, applicationId stays unset
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-foreground text-lg mb-1">Travel Details</h2>
            <p className="text-sm text-muted-foreground">Provide information about your intended travel.</p>
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
                      ? 'border-coral bg-brand-soft text-brand'
                      : 'border-border text-muted-foreground hover:border-border'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {errors.purposeOfTravel && <p className="text-xs text-destructive mt-1">{errors.purposeOfTravel.message}</p>}
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
        <Button type="button" variant="outline" onClick={prevStep} disabled={isSaving} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button type="submit" variant="brand" size="lg" isLoading={isSaving} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}