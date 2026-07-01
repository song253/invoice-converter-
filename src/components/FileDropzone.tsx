"use client";

import { useCallback, useState } from "react";
import type { ParsedFile } from "@/lib/types";
import { SOURCE_LABELS } from "@/lib/mappings/sources";

type Props = {
  files: ParsedFile[];
  onFilesAdded: (files: File[]) => void;
  onRemoveFile: (index: number) => void;
  isProcessing: boolean;
};

export default function FileDropzone({
  files,
  onFilesAdded,
  onRemoveFile,
  isProcessing,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        /\.(xlsx|xls|csv)$/i.test(f.name),
      );
      if (dropped.length > 0) onFilesAdded(dropped);
    },
    [onFilesAdded],
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) onFilesAdded(selected);
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 transition-all duration-300 ${
          isDragging
            ? "border-neutral-900 bg-neutral-50 scale-[1.01]"
            : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50"
        } ${isProcessing ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={isProcessing}
        />
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 transition-transform duration-300 group-hover:scale-105 ${
            isDragging ? "scale-110 bg-neutral-200" : ""
          }`}
        >
          <svg
            className="h-6 w-6 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
        </div>
        <p className="text-base font-medium text-neutral-900">
          {isDragging ? "여기에 놓으세요" : "엑셀 파일을 드래그하거나 클릭"}
        </p>
        <p className="mt-1 text-sm text-neutral-400">
          카페24, 네이버페이 등 주문 파일 · 여러 개 동시 업로드 가능
        </p>
      </label>

      {files.length > 0 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {files.map((file, index) => (
            <div
              key={`${file.fileName}-${index}`}
              className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/80 px-4 py-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                  <svg
                    className="h-4 w-4 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {file.fileName}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {SOURCE_LABELS[file.sourceFormat]} · {file.rowCount}건
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="ml-3 shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600"
                aria-label="파일 제거"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
