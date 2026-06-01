'use client';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface ApplicationFormData {
  // Step 1 – Choose destination
  visaTypeId: string;
  destinationCountryId: string;
  nationalityCountryId: string;
  processingTier: 'STANDARD' | 'EXPEDITED' | 'RUSH';

  // Step 2 – Personal Info
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantDob: string;
  applicantPassportNo: string;
  applicantPassportExpiry: string;

  // Step 3 – Travel Details
  travelDateFrom: string;
  travelDateTo: string;
  purposeOfTravel: string;
  accommodationAddress: string;

  // Step 4 – Documents (tracked separately as file uploads)
  // Step 5 – Review & Pay
}

interface WizardState {
  currentStep: number;
  totalSteps: number;
  applicationId: string | null;
  formData: Partial<ApplicationFormData>;
  isSubmitting: boolean;
  isSaving: boolean;
}

interface WizardActions {
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (data: Partial<ApplicationFormData>) => void;
  setApplicationId: (id: string) => void;
  setSubmitting: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  reset: () => void;
}

const initialState: WizardState = {
  currentStep: 1,
  totalSteps: 5,
  applicationId: null,
  formData: {},
  isSubmitting: false,
  isSaving: false,
};

export const useApplicationWizardStore = create<WizardState & WizardActions>()(
  immer((set) => ({
    ...initialState,

    setStep: (step) => set((s) => { s.currentStep = step; }),
    nextStep: () => set((s) => { if (s.currentStep < s.totalSteps) s.currentStep++; }),
    prevStep: () => set((s) => { if (s.currentStep > 1) s.currentStep--; }),
    updateFormData: (data) => set((s) => { Object.assign(s.formData, data); }),
    setApplicationId: (id) => set((s) => { s.applicationId = id; }),
    setSubmitting: (v) => set((s) => { s.isSubmitting = v; }),
    setSaving: (v) => set((s) => { s.isSaving = v; }),
    reset: () => set(() => ({ ...initialState })),
  }))
);
