import * as XLSX from "xlsx";
import { COURIER_TEMPLATES } from "./mappings/couriers";
import { detectSourceFormat, normalizeRow } from "./mappings/sources";
import type {
  ConvertResult,
  CourierId,
  NormalizedOrder,
  ParsedFile,
} from "./types";

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

function findHeaderRowIndex(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const textCells = row.filter(
      (cell) => typeof cell === "string" && cell.trim().length > 0,
    );
    if (textCells.length >= 3) return i;
  }
  return 0;
}

export async function parseOrderFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const rows = readWorkbookRows(buffer);
  const headerIndex = findHeaderRowIndex(rows);
  const headers = (rows[headerIndex] ?? []).map((cell) => String(cell ?? ""));
  const sourceFormat = detectSourceFormat(headers);

  const orders: NormalizedOrder[] = [];
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const normalized = normalizeRow(headers, row);
    if (normalized) orders.push(normalized);
  }

  return {
    fileName: file.name,
    sourceFormat,
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
      if (col.key === "empty") {
        row[col.header] = col.defaultValue ?? "";
      } else {
        row[col.header] = order[col.key] || col.defaultValue || "";
      }
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
      sourceFormat: file.sourceFormat,
      rowCount: file.rowCount,
    })),
  };
}

export function downloadExcel(
  result: ConvertResult,
  fileName = "택배업로드양식.xlsx",
): void {
  const rows = [
    result.headers,
    ...result.orders.map((order) =>
      result.headers.map((header) => order[header] ?? ""),
    ),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, fileName);
}
