import type { NormalizedOrder, SourceFormat } from "../types";
import { isCafe24Format, parseCafe24Row } from "./cafe24";
import {
  isNaverPayBulkTemplate,
  isNaverPayOrderFormat,
  parseNaverPayRow,
} from "./naver-pay";

export const SOURCE_LABELS: Record<SourceFormat, string> = {
  cafe24: "카페24",
  naver_pay: "네이버페이",
  unknown: "기타",
};

const FIELD_ALIASES: Record<keyof NormalizedOrder, string[]> = {
  recipientName: [
    "수령인명",
    "수령인",
    "수취인명",
    "받는분",
    "받는사람",
    "구매자명",
  ],
  recipientPhone: [
    "수령인 전화번호",
    "수령인전화번호",
    "수취인연락처2",
    "전화번호",
    "받는분전화",
  ],
  recipientMobile: [
    "수령인 휴대전화",
    "수령인휴대전화",
    "수취인연락처1",
    "휴대폰",
    "받는분휴대폰",
    "연락처",
    "전화번호1",
  ],
  zipCode: ["우편번호", "수령인 우편번호", "수취인우편번호", "받는분우편번호"],
  address: [
    "주소",
    "수령인 주소",
    "수령인주소",
    "통합배송지",
    "배송지",
    "받는분주소",
  ],
  orderNo: ["주문번호", "상품주문번호", "품목별 주문번호"],
  productName: ["상품명", "품목명", "주문상품명", "주문상품명(옵션포함)", "상품명1"],
  quantity: ["수량", "주문수량", "수량(A타입)"],
  deliveryMessage: ["배송메시지", "배송 메시지", "배송메세지", "배송요청사항"],
};

function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, " ");
}

export function detectSourceFormat(headers: string[]): SourceFormat {
  if (isCafe24Format(headers)) return "cafe24";
  if (isNaverPayOrderFormat(headers)) return "naver_pay";
  return "unknown";
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases) {
    const exact = normalized.findIndex((h) => h === alias);
    if (exact !== -1) return exact;
  }
  for (const alias of aliases) {
    const partial = normalized.findIndex(
      (h) => h.includes(alias) || alias.includes(h),
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

function parseGenericRow(
  headers: string[],
  row: unknown[],
): NormalizedOrder | null {
  const indices = Object.fromEntries(
    Object.entries(FIELD_ALIASES).map(([field, aliases]) => [
      field,
      findColumnIndex(headers, aliases),
    ]),
  ) as Record<keyof NormalizedOrder, number>;

  const order: NormalizedOrder = {
    recipientName: cellValue(row, indices.recipientName),
    recipientPhone: cellValue(row, indices.recipientPhone),
    recipientMobile: cellValue(row, indices.recipientMobile),
    zipCode: cellValue(row, indices.zipCode),
    address: cellValue(row, indices.address),
    orderNo: cellValue(row, indices.orderNo),
    productName: cellValue(row, indices.productName),
    quantity: cellValue(row, indices.quantity) || "1",
    deliveryMessage: cellValue(row, indices.deliveryMessage),
  };

  if (!order.recipientName && !order.recipientMobile && !order.address) {
    return null;
  }

  if (!order.recipientMobile && order.recipientPhone) {
    order.recipientMobile = order.recipientPhone;
  }

  return order;
}

export function parseOrderRow(
  sourceFormat: SourceFormat,
  headers: string[],
  row: unknown[],
): NormalizedOrder | null {
  switch (sourceFormat) {
    case "cafe24":
      return parseCafe24Row(headers, row);
    case "naver_pay":
      return parseNaverPayRow(headers, row);
    default:
      return parseGenericRow(headers, row);
  }
}

export { isNaverPayBulkTemplate };
