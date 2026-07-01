export type CourierId = "lotte";

export type NormalizedOrder = {
  recipientName: string;
  recipientPhone: string;
  recipientMobile: string;
  zipCode: string;
  address: string;
  orderNo: string;
  productName: string;
  quantity: string;
  deliveryMessage: string;
};

export type ParsedFile = {
  fileName: string;
  orders: NormalizedOrder[];
  rowCount: number;
};

export type CourierColumnKey = keyof NormalizedOrder | "empty" | "phoneCombined";

export type CourierTemplate = {
  id: CourierId;
  name: string;
  description: string;
  color: string;
  columns: {
    key: CourierColumnKey;
    header: string;
    defaultValue?: string;
  }[];
};

export type ConvertResult = {
  courierName: string;
  orders: Record<string, string>[];
  headers: string[];
  totalCount: number;
  sourceSummary: { fileName: string; rowCount: number }[];
};

export class ExcelParseError extends Error {
  constructor(
    message: string,
    public readonly code: "PASSWORD_REQUIRED" | "INVALID_TEMPLATE" | "GENERIC",
  ) {
    super(message);
    this.name = "ExcelParseError";
  }
}
