import type { NormalizedOrder } from "../types";

function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, " ");
}

function findColumnIndex(headers: string[], names: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const name of names) {
    const exact = normalized.findIndex((h) => h === name);
    if (exact !== -1) return exact;
  }
  for (const name of names) {
    const partial = normalized.findIndex(
      (h) => h.includes(name) || name.includes(h),
    );
    if (partial !== -1) return partial;
  }
  return -1;
}

function cellValue(row: unknown[], index: number): string {
  if (index === -1) return "";
  const value = row[index];
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function isNaverPayOrderFormat(headers: string[]): boolean {
  const normalized = headers.map(normalizeHeader);
  const hasOrderColumns =
    normalized.includes("상품주문번호") ||
    (normalized.includes("수취인명") && normalized.includes("통합배송지"));
  return hasOrderColumns;
}

export function isNaverPayBulkTemplate(headers: string[]): boolean {
  if (headers.length <= 2) {
    const first = String(headers[0] ?? "");
    return first.includes("엑셀 일괄발송") || first.includes("상품주문번호, 배송방법");
  }
  return false;
}

export function parseNaverPayRow(
  headers: string[],
  row: unknown[],
): NormalizedOrder | null {
  const get = (...names: string[]) =>
    cellValue(row, findColumnIndex(headers, names));

  const productName = get("상품명");
  const optionInfo = get("옵션정보");
  const combinedProduct = optionInfo
    ? `${productName}(${optionInfo})`.trim()
    : productName;

  const order: NormalizedOrder = {
    recipientName: get("수취인명", "수취인"),
    recipientPhone: get("수취인연락처2"),
    recipientMobile: get("수취인연락처1", "수취인 휴대폰"),
    zipCode: get("우편번호", "수취인우편번호"),
    address: get("통합배송지", "수취인주소", "배송지"),
    orderNo: get("상품주문번호", "주문번호"),
    productName: combinedProduct,
    quantity: get("수량") || "1",
    deliveryMessage: get("배송메세지", "배송메시지", "배송요청사항"),
  };

  if (!order.recipientMobile && order.recipientPhone) {
    order.recipientMobile = order.recipientPhone;
  }

  if (!order.recipientName && !order.recipientMobile && !order.address) {
    return null;
  }

  return order;
}
