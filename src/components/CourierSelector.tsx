"use client";

import { COURIER_TEMPLATES } from "@/lib/mappings/couriers";
import type { CourierId } from "@/lib/types";

type Props = {
  selected: CourierId | null;
  onSelect: (id: CourierId) => void;
};

export default function CourierSelector({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {COURIER_TEMPLATES.map((courier) => {
        const isSelected = selected === courier.id;

        return (
          <button
            key={courier.id}
            type="button"
            onClick={() => onSelect(courier.id)}
            className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
              isSelected
                ? "border-neutral-900 bg-neutral-900 text-white shadow-lg shadow-neutral-900/10 scale-[1.02]"
                : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm"
            }`}
          >
            <div
              className="mb-3 h-1 w-8 rounded-full transition-all duration-200"
              style={{ backgroundColor: courier.color }}
            />
            <span
              className={`text-sm font-semibold ${
                isSelected ? "text-white" : "text-neutral-900"
              }`}
            >
              {courier.name}
            </span>
            <span
              className={`mt-0.5 text-xs ${
                isSelected ? "text-neutral-300" : "text-neutral-400"
              }`}
            >
              {courier.description}
            </span>
            {isSelected && (
              <div className="absolute right-3 top-3">
                <svg
                  className="h-5 w-5 text-white"
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
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
