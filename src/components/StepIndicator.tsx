"use client";

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1, label: "파일 업로드" },
  { num: 2, label: "택배사 선택" },
  { num: 3, label: "변환 완료" },
] as const;

export default function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {STEPS.map((step, index) => {
        const isActive = step.num === currentStep;
        const isDone = step.num < currentStep;

        return (
          <div key={step.num} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-neutral-900 text-white scale-110"
                    : isDone
                      ? "bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {isDone ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.num
                )}
              </div>
              <span
                className={`hidden text-sm font-medium transition-colors sm:block ${
                  isActive ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-px w-8 sm:w-16 transition-colors duration-300 ${
                  isDone ? "bg-neutral-900" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
