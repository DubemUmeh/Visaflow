"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  User,
  MapPin,
  FileText,
  CreditCard,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useApplicationWizardStore } from "@/store/application.store";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Step Components
import StepSelectVisa from "@/components/application/step-select-visa";
import StepPersonalInfo from "@/components/application/step-personal-info";
import StepTravelDetails from "@/components/application/step-travel-details";
import StepDocuments from "@/components/application/step-documents";
import StepReviewPay from "@/components/application/step-review-pay";

const STEPS = [
  { id: 1, label: "Visa Type", icon: Globe },
  { id: 2, label: "Personal", icon: User },
  { id: 3, label: "Travel", icon: MapPin },
  { id: 4, label: "Documents", icon: FileText },
  { id: 5, label: "Review", icon: CreditCard },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
                  isCompleted
                    ? "bg-brand text-white"
                    : isActive
                      ? "bg-brand text-white ring-4 ring-blue-100"
                      : "bg-muted text-muted-foreground/70",
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 font-medium hidden sm:block",
                  isActive
                    ? "text-brand"
                    : isCompleted
                      ? "text-muted-foreground"
                      : "text-muted-foreground/70",
                )}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-8 sm:w-16 mx-1 sm:mx-2 mb-4 transition-colors",
                  currentStep > step.id ? "bg-brand" : "bg-gray-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const stepComponents: Record<number, React.ComponentType> = {
  1: StepSelectVisa,
  2: StepPersonalInfo,
  3: StepTravelDetails,
  4: StepDocuments,
  5: StepReviewPay,
};

export default function NewApplicationPage() {
  // reset is intentionally not called here — state must survive refreshes and
  // back/forward navigation. The store persists to sessionStorage and reset()
  // is called by StepReviewPay after a successful submission.
  const { currentStep } = useApplicationWizardStore();
  const { user } = useAuthStore();

  if (user && !user.emailVerified) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Verify your email to apply
            </h1>
            <p className="mt-2 text-muted-foreground">
              VisaFlow protects applicant records by requiring email
              verification before a visa application can be started.
            </p>
            <Button asChild variant="brand" className="mt-6">
              <a href="/dashboard/settings/profile">
                Review profile verification
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StepComponent = stepComponents[currentStep] ?? StepSelectVisa;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          New Visa Application
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete the steps below to submit your application.
        </p>
      </div>

      <StepIndicator currentStep={currentStep} />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <StepComponent />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
