import * as XLSX from "xlsx";
import { OfficeFile } from "office-crypto";
import { COURIER_TEMPLATES } from "./mappings/couriers";
import {
  hasRecognizableColumns,
  isInstructionOnlySheet,
  parseOrderRow,
} from "./mappings/extract";
import type {
  ConvertResult,
  CourierColumnKey,
  CourierId,
  NormalizedOrder,
  ParsedFile,
} from "./types";
import { ExcelParseError } from "./types";

export type ParseOptions = {
  password?: string;
};

function readWorkbookRows(data: ArrayBuffer): unknown[][] {
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
}

function isPasswordProtectedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("password-protected") || message.includes("Password");
}

function decryptBuffer(buffer: ArrayBuffer, password: string): ArrayBuffer {
  const file = OfficeFile(new Uint8Array(buffer));
  file.loadKey({ password, verifyPassword: true });
  const decrypted = file.decrypt();
  const copy = new Uint8Array(decrypted.byteLength);
  copy.set(decrypted);
  return copy.buffer;
}

async function loadWorkbookRows(
  buffer: ArrayBuffer,
  password?: string,
): Promise<unknown[][]> {
  try {
    return readWorkbookRows(buffer);
  } catch (error) {
    if (!isPasswordProtectedError(error)) {
      throw new ExcelParseError(
        "파일을 읽을 수 없습니다. 엑셀 형식을 확인해 주세요.",
        "GENERIC",
      );
    }

    if (!password) {
      throw new ExcelParseError(
        "암호화된 엑셀입니다. 다운로드 시 설정한 비밀번호를 입력해 주세요.",
        "PASSWORD_REQUIRED",
      );
    }

    try {
      const decrypted = decryptBuffer(buffer, password);
      return readWorkbookRows(decrypted);
    } catch {
      throw new ExcelParseError(
        "비밀번호가 올바르지 않습니다. 설정한 암호를 확인해 주세요.",
        "PASSWORD_REQUIRED",
      );
    }
  }
}

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const textCells = row.filter(
      (cell) => String(cell ?? "").trim().length > 0,
    );
    if (textCells.length >= 3) return i;
  }
  return 0;
}

function resolveCourierValue(
  order: NormalizedOrder,
  key: CourierColumnKey,
  defaultValue?: string,
): string {
  if (key === "empty") return defaultValue ?? "";
  if (key === "phoneCombined") {
    return order.recipientMobile || order.recipientPhone || defaultValue || "";
  }
  return order[key] || defaultValue || "";
}

export async function parseOrderFile(
  file: File,
  options: ParseOptions = {},
): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const rows = await loadWorkbookRows(buffer, options.password);

  const headerIndex = findHeaderRowIndex(rows);
  const headers = (rows[headerIndex] ?? []).map((cell) => String(cell ?? ""));

  if (isInstructionOnlySheet(headers)) {
    throw new ExcelParseError(
      "주문 데이터가 없는 안내 양식입니다. 주문 정보가 담긴 엑셀 파일을 업로드해 주세요.",
      "INVALID_TEMPLATE",
    );
  }

  if (!hasRecognizableColumns(headers)) {
    throw new ExcelParseError(
      "주문 정보를 찾을 수 없습니다. 수령인, 연락처, 주소, 상품명 등이 포함된 파일인지 확인해 주세요.",
      "GENERIC",
    );
  }

  const orders: NormalizedOrder[] = [];

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const normalized = parseOrderRow(headers, row);
    if (normalized) orders.push(normalized);
  }

  if (orders.length === 0) {
    throw new ExcelParseError(
      "주문 데이터를 읽지 못했습니다. 파일에 데이터 행이 있는지 확인해 주세요.",
      "GENERIC",
    );
  }

  return {
    fileName: file.name,
    orders,
    rowCount: orders.length,
  };
}

export function convertToCourierFormat(
  parsedFiles: ParsedFile[],
  courierId: CourierId,
): ConvertResult {
  const template = COURIER_TEMPLATES.find((c) => c.id === courierId);
  if (!template) {
    throw new Error("택배사 템플릿을 찾을 수 없습니다.");
  }

  const allOrders = parsedFiles.flatMap((file) => file.orders);
  const headers = template.columns.map((col) => col.header);

  const orders = allOrders.map((order) => {
    const row: Record<string, string> = {};
    for (const col of template.columns) {
      row[col.header] = resolveCourierValue(order, col.key, col.defaultValue);
    }
    return row;
  });

  return {
    courierName: template.name,
    orders,
    headers,
    totalCount: orders.length,
    sourceSummary: parsedFiles.map((file) => ({
      fileName: file.fileName,
      rowCount: file.rowCount,
    })),
  };
}

export function generateDownloadFileName(result: ConvertResult): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `롯데택배_${date}_${result.totalCount}건.xlsx`;
}

function getDisplayWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += char.charCodeAt(0) > 127 ? 2 : 1;
  }
  return width;
}

function autoFitColumnWidths(rows: string[][]): { wch: number }[] {
  const columnCount = rows[0]?.length ?? 0;
  const maxWidths = new Array<number>(columnCount).fill(8);

  for (const row of rows) {
    row.forEach((cell, index) => {
      const cellWidth = getDisplayWidth(String(cell ?? ""));
      maxWidths[index] = Math.max(maxWidths[index], cellWidth);
    });
  }

  return maxWidths.map((width) => ({
    wch: Math.min(width + 2, 80),
  }));
}

export function downloadExcel(
  result: ConvertResult,
  fileName = generateDownloadFileName(result),
): void {
  const rows = [
    result.headers,
    ...result.orders.map((order) =>
      result.headers.map((header) => order[header] ?? ""),
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = autoFitColumnWidths(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, fileName);
}
