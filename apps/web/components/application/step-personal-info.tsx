'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, ChevronLeft, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { useApplicationWizardStore } from '@/store/application.store';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import { toast } from 'sonner';

const schema = z.object({
  applicantFirstName:     z.string().min(2, 'First name required'),
  applicantLastName:      z.string().min(2, 'Last name required'),
  applicantEmail:         z.string().email('Valid email required'),
  applicantPhone:         z.string().min(5, 'Phone number required'),
  applicantDob:           z.string().min(1, 'Date of birth required'),
  applicantPassportNo:    z.string().min(3, 'Passport number required'),
  applicantPassportExpiry:z.string().min(1, 'Passport expiry required'),
});

type FormData = z.infer<typeof schema>;

export default function StepPersonalInfo() {
  const { updateFormData, nextStep, prevStep, formData } = useApplicationWizardStore();
  const { user } = useAuthStore();
  const [aiNotes, setAiNotes] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      applicantFirstName:      formData.applicantFirstName      ?? user?.firstName ?? '',
      applicantLastName:       formData.applicantLastName       ?? user?.lastName  ?? '',
      applicantEmail:          formData.applicantEmail          ?? user?.email     ?? '',
      applicantPhone:          formData.applicantPhone          ?? user?.phone     ?? '',
      applicantDob:            formData.applicantDob            ?? user?.dateOfBirth ?? '',
      applicantPassportNo:     formData.applicantPassportNo     ?? user?.passportNumber ?? '',
      applicantPassportExpiry: formData.applicantPassportExpiry ?? '',
    },
  });

  const onSubmit = (data: FormData) => {
    updateFormData(data);
    nextStep();
  };

  const handleAiAutofill = async () => {
    if (!aiNotes.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/autofill-applicant', {
        prompt: aiNotes,
        visaName: formData.visaTypeId ?? 'visa application',
      });
      const fields = data.data?.fields ?? {};
      if (fields.given_name) setValue('applicantFirstName', fields.given_name);
      if (fields.family_name) setValue('applicantLastName', fields.family_name);
      if (fields.phone) setValue('applicantPhone', fields.phone);
      if (fields.date_of_birth) setValue('applicantDob', fields.date_of_birth);
      if (fields.passport_number) setValue('applicantPassportNo', fields.passport_number);
      if (fields.passport_expiry) setValue('applicantPassportExpiry', fields.passport_expiry);
      toast.success('AI suggestions applied');
    } catch {
      toast.error('AI autofill failed');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          <div>
            <h2 className="font-semibold text-foreground text-lg mb-1">Personal Information</h2>
            <p className="text-sm text-muted-foreground">Enter the applicant's personal details as they appear on their passport.</p>
          </div>

          <div className="rounded-xl border border-brand-soft bg-brand-soft p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-brand" />
              <div className="flex-1 space-y-3">
                <textarea
                  value={aiNotes}
                  onChange={e => setAiNotes(e.target.value)}
                  placeholder="Paste passport notes or applicant details to fill fields faster..."
                  className="min-h-20 w-full resize-none rounded-lg border border-brand-soft bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiAutofill}
                  disabled={!aiNotes.trim() || aiLoading}
                  className="gap-2 bg-card"
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Autofill with AI
                </Button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="Jane"
              leftIcon={<User />}
              error={errors.applicantFirstName?.message}
              {...register('applicantFirstName')}
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              error={errors.applicantLastName?.message}
              {...register('applicantLastName')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail />}
            error={errors.applicantEmail?.message}
            {...register('applicantEmail')}
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 555 000 0000"
            leftIcon={<Phone />}
            error={errors.applicantPhone?.message}
            {...register('applicantPhone')}
          />

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Date of Birth"
              type="date"
              error={errors.applicantDob?.message}
              {...register('applicantDob')}
            />
            <div />
          </div>

          <div className="border-t border-border/70 pt-5">
            <h3 className="font-medium text-foreground mb-4">Passport Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Passport Number"
                placeholder="AB1234567"
                hint="As it appears on your passport"
                error={errors.applicantPassportNo?.message}
                {...register('applicantPassportNo')}
              />
              <Input
                label="Passport Expiry Date"
                type="date"
                error={errors.applicantPassportExpiry?.message}
                {...register('applicantPassportExpiry')}
              />
            </div>
          </div>
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
