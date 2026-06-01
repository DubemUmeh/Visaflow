'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, CreditCard, ChevronLeft, Globe, User, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApplicationWizardStore } from '@/store/application.store';
import { toast } from 'sonner';
import api from '@/lib/api';
import dayjs from 'dayjs';

const tierPriceMultiplier: Record<string, number> = {
  STANDARD: 1,
  EXPEDITED: 1.5,
  RUSH: 2.5,
};

export default function StepReviewPay() {
  const router = useRouter();
  const { formData, prevStep, setSubmitting, isSubmitting, reset } = useApplicationWizardStore();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        visaTypeId:         formData.visaTypeId,
        destinationCountryId: formData.destinationCountryId,
        nationalityCountryId: formData.nationalityCountryId,
        processingTier:     formData.processingTier ?? 'STANDARD',
        applicantFirstName: formData.applicantFirstName,
        applicantLastName:  formData.applicantLastName,
        applicantEmail:     formData.applicantEmail,
        applicantPhone:     formData.applicantPhone,
        applicantDob:       formData.applicantDob,
        applicantPassportNo: formData.applicantPassportNo,
        applicantPassportExpiry: formData.applicantPassportExpiry,
        travelDateFrom:     formData.travelDateFrom,
        travelDateTo:       formData.travelDateTo,
        formData: {
          purposeOfTravel:      formData.purposeOfTravel,
          accommodationAddress: formData.accommodationAddress,
        },
      };

      const { data } = await api.post('/applications', payload);
      const application = data.data;
      const origin = window.location.origin;
      const checkout = await api.post('/payments/checkout', {
        applicationId: application.id,
        processingTier: formData.processingTier ?? 'STANDARD',
        currency: 'USD',
        successUrl: `${origin}/dashboard/applications/${application.id}`,
        cancelUrl: `${origin}/dashboard/applications/${application.id}`,
        provider: 'stripe',
      });

      setSubmitted(true);
      toast.success('Application submitted successfully!');
      setTimeout(() => {
        reset();
        window.location.href = checkout.data.data.checkoutUrl;
      }, 2000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Submission failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
        <p className="text-gray-500">Redirecting you to your application details…</p>
      </motion.div>
    );
  }

  const sections = [
    {
      icon: Globe,
      title: 'Visa Details',
      items: [
        { label: 'Visa Type ID',   value: formData.visaTypeId   ?? '—' },
        { label: 'Processing',     value: formData.processingTier ?? '—' },
      ],
    },
    {
      icon: User,
      title: 'Personal Information',
      items: [
        { label: 'Full Name',    value: `${formData.applicantFirstName ?? ''} ${formData.applicantLastName ?? ''}`.trim() || '—' },
        { label: 'Email',        value: formData.applicantEmail ?? '—' },
        { label: 'Phone',        value: formData.applicantPhone ?? '—' },
        { label: 'Date of Birth',value: formData.applicantDob ? dayjs(formData.applicantDob).format('DD MMM YYYY') : '—' },
        { label: 'Passport No.', value: formData.applicantPassportNo ?? '—' },
        { label: 'Expiry',       value: formData.applicantPassportExpiry ? dayjs(formData.applicantPassportExpiry).format('DD MMM YYYY') : '—' },
      ],
    },
    {
      icon: MapPin,
      title: 'Travel Details',
      items: [
        { label: 'From',          value: formData.travelDateFrom ? dayjs(formData.travelDateFrom).format('DD MMM YYYY') : '—' },
        { label: 'To',            value: formData.travelDateTo   ? dayjs(formData.travelDateTo).format('DD MMM YYYY')   : '—' },
        { label: 'Purpose',       value: formData.purposeOfTravel      ?? '—' },
        { label: 'Accommodation', value: formData.accommodationAddress ?? '—' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 text-lg mb-1">Review Your Application</h2>
          <p className="text-sm text-gray-500 mb-6">Please verify all details before submitting. You can go back to edit.</p>

          <div className="space-y-6">
            {sections.map(section => (
              <div key={section.title}>
                <div className="flex items-center gap-2 mb-3">
                  <section.icon className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 pl-6">
                  {section.items.map(item => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium text-gray-900 text-right ml-4 truncate max-w-[60%]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-5 text-sm text-blue-800">
          <p className="font-semibold mb-1">Before you submit</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700 text-xs">
            <li>All information must match your passport exactly</li>
            <li>Processing fees are non-refundable once the application is submitted</li>
            <li>Additional documents may be requested during review</li>
            <li>By submitting you agree to our Terms of Service and Privacy Policy</li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting} className="gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          type="button"
          variant="brand"
          size="lg"
          onClick={handleSubmit}
          isLoading={isSubmitting}
          className="gap-2"
        >
          <CreditCard className="w-4 h-4" />
          Submit Application
        </Button>
      </div>
    </div>
  );
}
