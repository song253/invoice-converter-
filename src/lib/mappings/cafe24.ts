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
  return -1;
}

function cellValue(row: unknown[], index: number): string {
  if (index === -1) return "";
  const value = row[index];
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function isCafe24Format(headers: string[]): boolean {
  const normalized = headers.map(normalizeHeader);
  return (
    normalized.includes("쇼핑몰") &&
    normalized.includes("수령인") &&
    normalized.includes("수령인 휴대전화")
  );
}

export function parseCafe24Row(
  headers: string[],
  row: unknown[],
): NormalizedOrder | null {
  const get = (...names: string[]) =>
    cellValue(row, findColumnIndex(headers, names));

  const baseAddress = get("수령인 주소");
  const detailAddress = get("수령인 상세 주소");
  const address = [baseAddress, detailAddress].filter(Boolean).join(" ").trim();

  const order: NormalizedOrder = {
    recipientName: get("수령인"),
    recipientPhone: "",
    recipientMobile: get("수령인 휴대전화"),
    zipCode: get("수령인 우편번호"),
    address,
    orderNo: get("주문번호", "품목별 주문번호"),
    productName:
      get("주문상품명(옵션포함)") || get("주문상품명"),
    quantity: get("수량") || "1",
    deliveryMessage: get("배송메시지"),
  };

  if (!order.recipientName && !order.recipientMobile && !order.address) {
    return null;
  }

  return order;
}
