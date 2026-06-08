'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface ApplicationFormData {
  visaTypeId: string;
  destinationCountryId: string;
  nationalityCountryId: string;
  processingTier: 'STANDARD' | 'EXPEDITED' | 'RUSH';
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone: string;
  applicantDob: string;
  applicantPassportNo: string;
  applicantPassportExpiry: string;
  travelDateFrom: string;
  travelDateTo: string;
  purposeOfTravel: string;
  accommodationAddress: string;
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
  persist(
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
    })),
    {
      name: 'visaflow-wizard',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the fields that matter — skip transient flags
      partialize: (s) => ({
        currentStep: s.currentStep,
        formData: s.formData,
        applicationId: s.applicationId,
      }),
    }
  )
);