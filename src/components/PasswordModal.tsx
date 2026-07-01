"use client";

import { useEffect, useRef } from "react";

type Props = {
  fileNames: string[];
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  error?: string | null;
};

export default function PasswordModal({
  fileNames,
  password,
  onPasswordChange,
  onSubmit,
  onCancel,
  isProcessing,
  error,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password && !isProcessing) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300"
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
          <svg
            className="h-6 w-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        <h3
          id="password-modal-title"
          className="text-lg font-semibold text-neutral-900"
        >
          비밀번호가 필요합니다
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          암호화된 엑셀 파일입니다. 다운로드 시 설정한 비밀번호를 입력해
          주세요.
        </p>

        <ul className="mt-3 space-y-1">
          {fileNames.map((name) => (
            <li
              key={name}
              className="truncate rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
            >
              {name}
            </li>
          ))}
        </ul>

        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="비밀번호 입력"
          disabled={isProcessing}
          className="mt-4 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none transition-colors focus:border-neutral-900 disabled:bg-neutral-50"
        />

        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 rounded-xl border border-neutral-200 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!password || isProcessing}
            className="flex-1 rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white transition-all hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {isProcessing ? "열기 중..." : "파일 열기"}
          </button>
        </div>
      </div>
    </div>
  );
}
