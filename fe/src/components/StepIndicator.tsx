// fe/src/components/StepIndicator.tsx

import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Check In" },
  { number: 2, label: "Take Photo" },
  { number: 3, label: "Print Badge" },
];

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const safeStep = Math.min(Math.max(Number(currentStep) || 1, 1), steps.length);

  // 1 -> 0%, 2 -> 50%, 3 -> 100%
  const progressPct = ((safeStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto mb-12 px-4">
      <div className="relative">
        {/* Track */}
        <div className="absolute left-0 right-0 top-8 h-1 bg-border rounded-full" />

        {/* Progress */}
        <div
          className="absolute left-0 top-8 h-1 bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />

        {/* Steps (grid ensures equal spacing + fixes step 3 alignment) */}
        <div className="grid grid-cols-3 gap-4">
          {steps.map((step) => {
            const isDone = safeStep > step.number;
            const isActive = safeStep === step.number;

            return (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div
                  className={[
                    "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold z-10",
                    "transition-all duration-300",
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-secondary text-muted-foreground",
                  ].join(" ")}
                >
                  {isDone ? <Check className="w-8 h-8" /> : step.number}
                </div>

                <span
                  className={[
                    "mt-3 text-base font-semibold",
                    safeStep >= step.number ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
