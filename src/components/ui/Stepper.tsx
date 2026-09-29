import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  title: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number; // 1-indexed
  onStepClick?: (stepIndex: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full">
      {/* Mobile view */}
      <div className="md:hidden flex items-center justify-between px-2 py-3 mb-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Étape {currentStep} sur {steps.length}
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
            {steps[currentStep - 1]?.title}
          </p>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i + 1 === currentStep
                  ? 'w-6 bg-emerald-500'
                  : i + 1 < currentStep
                  ? 'w-2 bg-emerald-600'
                  : 'w-2 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop view */}
      <div className="hidden md:flex items-center justify-between relative mb-8">
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-800 -z-0" />
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isDone = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div
              key={idx}
              className="flex flex-col items-center relative z-10 select-none group cursor-default"
              onClick={() => isDone && onStepClick && onStepClick(stepNumber)}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-xs cursor-pointer'
                    : isCurrent
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-white ring-4 ring-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {isDone ? <Check size={16} strokeWidth={3} /> : stepNumber}
              </div>
              <div className="mt-2 text-center">
                <span
                  className={`text-xs font-semibold block ${
                    isCurrent
                      ? 'text-slate-900 dark:text-white'
                      : isDone
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
