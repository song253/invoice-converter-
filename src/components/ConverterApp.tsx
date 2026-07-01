"use client";

import { useCallback, useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import FileDropzone from "@/components/FileDropzone";
import CourierSelector from "@/components/CourierSelector";
import PasswordModal from "@/components/PasswordModal";
import {
  convertToCourierFormat,
  downloadExcel,
  parseOrderFile,
} from "@/lib/excel";
import type { ConvertResult, CourierId, ParsedFile } from "@/lib/types";
import { ExcelParseError } from "@/lib/types";

export default function ConverterApp() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<CourierId>("lotte");
  const [excelPassword, setExcelPassword] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalOrders = files.reduce((sum, f) => sum + f.rowCount, 0);

  const processFiles = useCallback(async (newFiles: File[], password?: string) => {
    setError(null);
    setPasswordError(null);
    setIsProcessing(true);

    const parsed: ParsedFile[] = [];
    const needsPassword: File[] = [];

    for (const file of newFiles) {
      try {
        parsed.push(await parseOrderFile(file, { password }));
      } catch (err) {
        if (err instanceof ExcelParseError && err.code === "PASSWORD_REQUIRED") {
          needsPassword.push(file);
        } else if (err instanceof ExcelParseError) {
          setError(err.message);
        } else {
          setError("파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해 주세요.");
        }
      }
    }

    if (parsed.length > 0) {
      setFiles((prev) => [...prev, ...parsed]);
    }

    if (needsPassword.length > 0) {
      setPendingFiles(needsPassword);
      setShowPasswordModal(true);
      setPasswordError(
        password
          ? "비밀번호가 올바르지 않습니다. 다운로드 시 설정한 암호를 확인해 주세요."
          : null,
      );
    } else {
      setPendingFiles([]);
      setShowPasswordModal(false);
      setExcelPassword("");
    }

    setIsProcessing(false);
  }, []);

  const handleFilesAdded = useCallback(
    async (newFiles: File[]) => {
      await processFiles(newFiles);
    },
    [processFiles],
  );

  const handlePasswordSubmit = async () => {
    if (pendingFiles.length === 0 || !excelPassword) return;
    await processFiles(pendingFiles, excelPassword);
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingFiles([]);
    setExcelPassword("");
    setPasswordError(null);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  };

  const handleConvert = () => {
    if (files.length === 0) return;
    setError(null);
    try {
      const converted = convertToCourierFormat(files, selectedCourier);
      if (converted.totalCount === 0) {
        setError("변환할 주문 데이터가 없습니다. 파일 내용을 확인해 주세요.");
        return;
      }
      setResult(converted);
      setStep(3);
    } catch {
      setError("변환 중 오류가 발생했습니다.");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    downloadExcel(result);
  };

  const handleReset = () => {
    setStep(1);
    setFiles([]);
    setPendingFiles([]);
    setSelectedCourier("lotte");
    setExcelPassword("");
    setShowPasswordModal(false);
    setPasswordError(null);
    setResult(null);
    setError(null);
  };

  return (
    <>
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
        <header className="mb-10 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            송장변환기
          </h1>
        <p className="mt-2 text-sm text-neutral-500 sm:text-base">
          주문 엑셀 → 롯데택배 업로드 양식
        </p>
        </header>

        <div className="mb-8">
          <StepIndicator currentStep={step} />
        </div>

        <div className="rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm sm:p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  주문 파일 업로드
                </h2>
              <p className="mt-1 text-sm text-neutral-400">
                주문 엑셀 파일을 올리면 필요한 정보만 자동으로 추출합니다.
                암호화된 파일은 비밀번호를 입력해 주세요.
              </p>
              </div>
              <FileDropzone
                files={files}
                onFilesAdded={handleFilesAdded}
                onRemoveFile={handleRemoveFile}
                isProcessing={isProcessing}
              />

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <button
                type="button"
                disabled={files.length === 0 || totalOrders === 0}
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                다음 · {totalOrders}건 확인됨
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  택배사 양식
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  롯데택배송장양식 기준으로 변환됩니다.
                </p>
              </div>
              <CourierSelector
                selected={selectedCourier}
                onSelect={setSelectedCourier}
              />
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-neutral-200 py-3.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                >
                  이전
                </button>
                <button
                  type="button"
                  onClick={handleConvert}
                  className="flex-1 rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800"
                >
                  변환하기
                </button>
              </div>
            </div>
          )}

          {step === 3 && result && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <svg
                    className="h-8 w-8 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  변환 완료
                </h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {result.courierName} 양식 · 총{" "}
                  <span className="font-medium text-neutral-900">
                    {result.totalCount}건
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  변환 내역
                </p>
                <ul className="space-y-1">
                  {result.sourceSummary.map((item) => (
                    <li
                      key={item.fileName}
                      className="flex justify-between text-sm text-neutral-600"
                    >
                      <span className="truncate">{item.fileName}</span>
                    <span className="ml-2 shrink-0 text-neutral-400">
                      {item.rowCount}건
                    </span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-all hover:bg-neutral-800"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                롯데택배 양식 다운로드
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="w-full rounded-xl border border-neutral-200 py-3.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
              >
                처음부터 다시
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-300">
          모든 처리는 브라우저에서만 이루어지며, 파일이 서버로 전송되지 않습니다.
        </p>
      </div>

      {showPasswordModal && (
        <PasswordModal
          fileNames={pendingFiles.map((f) => f.name)}
          password={excelPassword}
          onPasswordChange={(value) => {
            setExcelPassword(value);
            setPasswordError(null);
          }}
          onSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
          isProcessing={isProcessing}
          error={passwordError}
        />
      )}
    </>
  );
}
