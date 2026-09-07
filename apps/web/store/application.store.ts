"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { ApplicationEntity } from "@visaflow/shared-types";

export interface ApplicationFormData {
  applicationId: string;
  visaTypeId: string;
  destinationCountryId: string;
  nationalityCountryId: string;
  processingTier: "STANDARD" | "EXPEDITED" | "RUSH";
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
  ownerUserId: string | null;
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
  setOwnerUserId: (id: string | null) => void;
  setSubmitting: (v: boolean) => void;
  setSaving: (v: boolean) => void;
  hydrateFromApplication: (application: ApplicationEntity) => void;
  reset: () => void;
}

const initialState: WizardState = {
  currentStep: 1,
  totalSteps: 5,
  applicationId: null,
  ownerUserId: null,
  formData: {},
  isSubmitting: false,
  isSaving: false,
};

export const useApplicationWizardStore = create<WizardState & WizardActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      setStep: (step) =>
        set((s) => {
          s.currentStep = step;
        }),
      nextStep: () =>
        set((s) => {
          if (s.currentStep < s.totalSteps) s.currentStep++;
        }),
      prevStep: () =>
        set((s) => {
          if (s.currentStep > 1) s.currentStep--;
        }),
      updateFormData: (data) =>
        set((s) => {
          Object.assign(s.formData, data);
        }),
      setApplicationId: (id) =>
        set((s) => {
          s.applicationId = id;
        }),
      setOwnerUserId: (id) =>
        set((s) => {
          s.ownerUserId = id;
        }),
      setSubmitting: (v) =>
        set((s) => {
          s.isSubmitting = v;
        }),
      setSaving: (v) =>
        set((s) => {
          s.isSaving = v;
        }),
      hydrateFromApplication: (application) =>
        set((s) => {
          const formData = application.formData ?? {};
          s.applicationId = application.id;
          s.ownerUserId = application.userId;
          s.currentStep = application.currentStep;
          s.formData = {
            visaTypeId: application.visaTypeId,
            destinationCountryId: application.destinationCountryId ?? "",
            nationalityCountryId: application.nationalityCountryId ?? "",
            processingTier: application.processingTier,
            applicantFirstName: application.applicantFirstName ?? "",
            applicantLastName: application.applicantLastName ?? "",
            applicantEmail: application.applicantEmail ?? "",
            applicantPhone: application.applicantPhone ?? "",
            applicantDob: application.applicantDob?.slice(0, 10) ?? "",
            applicantPassportNo: application.applicantPassportNo ?? "",
            applicantPassportExpiry:
              application.applicantPassportExpiry?.slice(0, 10) ?? "",
            travelDateFrom: application.travelDateFrom?.slice(0, 10) ?? "",
            travelDateTo: application.travelDateTo?.slice(0, 10) ?? "",
            purposeOfTravel:
              typeof formData.purposeOfTravel === "string"
                ? formData.purposeOfTravel
                : "",
            accommodationAddress:
              typeof formData.accommodationAddress === "string"
                ? formData.accommodationAddress
                : "",
          };
        }),
      reset: () => set(() => ({ ...initialState })),
    })),
    {
      name: "visaflow-wizard",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist the fields that matter — skip transient flags
      partialize: (s) => ({
        currentStep: s.currentStep,
        formData: s.formData,
        applicationId: s.applicationId,
        ownerUserId: s.ownerUserId,
      }),
    },
  ),
);
