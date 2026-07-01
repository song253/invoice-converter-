export type SourceFormat = "cafe24" | "naver_pay" | "unknown";

export type CourierId = "cj" | "hanjin" | "lotte" | "epost";

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
  sourceFormat: SourceFormat;
  orders: NormalizedOrder[];
  rowCount: number;
};

export type CourierTemplate = {
  id: CourierId;
  name: string;
  description: string;
  color: string;
  columns: { key: keyof NormalizedOrder | "empty"; header: string; defaultValue?: string }[];
};

export type ConvertResult = {
  courierName: string;
  orders: Record<string, string>[];
  headers: string[];
  totalCount: number;
  sourceSummary: { fileName: string; sourceFormat: SourceFormat; rowCount: number }[];
};
