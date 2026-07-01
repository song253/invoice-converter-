import type { NormalizedOrder } from "../types";

function normalizeHeader(header: string): string {
  return header.trim().replace(/\s+/g, " ");
}

function compactHeader(header: string): string {
  return normalizeHeader(header).replace(/\s/g, "");
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader);
  const compact = headers.map(compactHeader);

  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const compactAlias = compactHeader(alias);

    const exact = normalized.findIndex((h) => h === normalizedAlias);
    if (exact !== -1) return exact;

    const compactExact = compact.findIndex((h) => h === compactAlias);
    if (compactExact !== -1) return compactExact;
  }

  const sortedAliases = [...aliases].sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    const normalizedAlias = normalizeHeader(alias);
    const partial = normalized.findIndex((h) => h.includes(normalizedAlias));
    if (partial !== -1) return partial;

    const compactAlias = compactHeader(alias);
    const compactPartial = compact.findIndex((h) => h.includes(compactAlias));
    if (compactPartial !== -1) return compactPartial;
  }

  return -1;
}

function cellValue(row: unknown[], index: number): string {
  if (index === -1) return "";
  const value = row[index];
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function getField(row: unknown[], headers: string[], aliases: string[]): string {
  return cellValue(row, findColumnIndex(headers, aliases));
}

const RECIPIENT_ALIASES = [
  "수취인명",
  "수령인",
  "수령인명",
  "받는사람",
  "받는분",
  "수하인명",
  "이름",
];
const PHONE2_ALIASES = [
  "수취인연락처2",
  "수령인 전화번호",
  "수령인전화번호",
  "수령지전화번호",
  "전화번호2",
  "전화번호",
  "받는분전화",
];
const PHONE1_ALIASES = [
  "핸드폰",
  "핸드폰번호",
  "수령인 휴대전화",
  "수령인휴대전화",
  "수취인연락처1",
  "휴대폰",
  "휴대폰번호",
  "휴대전화",
  "전화번호1",
  "받는분휴대폰",
  "연락처",
];
const ZIP_ALIASES = [
  "우편번호",
  "수령인 우편번호",
  "수취인우편번호",
  "받는분우편번호",
];
const ADDRESS_FULL_ALIASES = [
  "통합배송지",
  "배송지",
  "수령인주소",
  "받는분주소",
  "수하인주소",
];
const ADDRESS_BASE_ALIASES = ["수령인 주소", "수령인주소", "기본주소", "주소"];
const ADDRESS_DETAIL_ALIASES = [
  "수령인 상세 주소",
  "수령인상세주소",
  "상세주소",
  "상세 주소",
];
const PRODUCT_WITH_OPTION_ALIASES = [
  "주문상품명(옵션포함)",
  "상품명(옵션포함)",
];
const PRODUCT_ALIASES = ["상품명", "품목명", "주문상품명", "상품명1", "상품"];
const OPTION_ALIASES = ["옵션정보", "옵션", "옵션명"];
const QUANTITY_ALIASES = ["수량", "주문수량", "수량(A타입)", "구매수량"];
const MESSAGE_ALIASES = [
  "배송메시지",
  "배송 메시지",
  "배송메세지",
  "배송요청사항",
  "배송 요청사항",
  "요청사항",
  "비고",
  "배송비고",
  "메모",
  "배송메모",
];

const PHONE_PATTERN = /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/;

function looksLikePhone(value: string): boolean {
  return PHONE_PATTERN.test(value.replace(/\s/g, ""));
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("01")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith("01")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value.trim();
}

function scanRowForPhone(row: unknown[]): string {
  for (const cell of row) {
    const text = String(cell ?? "").trim();
    if (text && looksLikePhone(text)) {
      return normalizePhone(text);
    }
  }
  return "";
}

function resolveMobilePhone(headers: string[], row: unknown[]): string {
  const fromMobile = getField(row, headers, PHONE1_ALIASES);
  if (fromMobile && looksLikePhone(fromMobile)) {
    return normalizePhone(fromMobile);
  }

  const fromLandline = getField(row, headers, PHONE2_ALIASES);
  if (fromLandline && looksLikePhone(fromLandline)) {
    return normalizePhone(fromLandline);
  }

  const scanned = scanRowForPhone(row);
  if (scanned) return scanned;

  return fromMobile || fromLandline;
}

function resolveDeliveryMessage(headers: string[], row: unknown[]): string {
  return getField(row, headers, MESSAGE_ALIASES);
}

function resolveAddress(headers: string[], row: unknown[]): string {
  const full = getField(row, headers, ADDRESS_FULL_ALIASES);
  if (full) return full;

  const base = getField(row, headers, ADDRESS_BASE_ALIASES);
  const detail = getField(row, headers, ADDRESS_DETAIL_ALIASES);
  const combined = [base, detail].filter(Boolean).join(" ").trim();
  if (combined) return combined;

  return getField(row, headers, ["주소"]);
}

function resolveProductName(headers: string[], row: unknown[]): string {
  const withOption = getField(row, headers, PRODUCT_WITH_OPTION_ALIASES);
  if (withOption) return withOption;

  const product = getField(row, headers, PRODUCT_ALIASES);
  const option = getField(row, headers, OPTION_ALIASES);
  if (product && option) return `${product}(${option})`;
  return product;
}

/** 안내 문구만 있는 빈 양식 (주문 데이터 없음) */
export function isInstructionOnlySheet(headers: string[]): boolean {
  const nonEmpty = headers.filter((h) => String(h ?? "").trim().length > 0);
  if (nonEmpty.length > 3) return false;
  const first = String(headers[0] ?? "");
  return (
    first.includes("엑셀 일괄발송") ||
    first.includes("다운로드 받은 파일") ||
    first.includes("상품주문번호, 배송방법")
  );
}

export function parseOrderRow(
  headers: string[],
  row: unknown[],
): NormalizedOrder | null {
  const order: NormalizedOrder = {
    recipientName: getField(row, headers, RECIPIENT_ALIASES),
    recipientPhone: getField(row, headers, PHONE2_ALIASES),
    recipientMobile: resolveMobilePhone(headers, row),
    zipCode: getField(row, headers, ZIP_ALIASES),
    address: resolveAddress(headers, row),
    orderNo: getField(row, headers, [
      "상품주문번호",
      "주문번호",
      "품목별 주문번호",
    ]),
    productName: resolveProductName(headers, row),
    quantity: getField(row, headers, QUANTITY_ALIASES) || "1",
    deliveryMessage: resolveDeliveryMessage(headers, row),
  };

  if (!order.recipientMobile && order.recipientPhone) {
    order.recipientMobile = looksLikePhone(order.recipientPhone)
      ? normalizePhone(order.recipientPhone)
      : order.recipientPhone;
  }

  const hasData =
    order.recipientName || order.recipientMobile || order.address;
  if (!hasData) return null;

  return order;
}

/** 파일에 인식 가능한 주문 관련 컬럼이 있는지 확인 */
export function hasRecognizableColumns(headers: string[]): boolean {
  const checks = [
    RECIPIENT_ALIASES,
    PHONE1_ALIASES,
    ADDRESS_FULL_ALIASES,
    ADDRESS_BASE_ALIASES,
    PRODUCT_ALIASES,
    PRODUCT_WITH_OPTION_ALIASES,
  ];
  return checks.some((aliases) => findColumnIndex(headers, aliases) !== -1);
}
