import type { CourierTemplate } from "../types";

/** 롯데택배송장양식.xlsx 기준 */
export const COURIER_TEMPLATES: CourierTemplate[] = [
  {
    id: "lotte",
    name: "롯데택배",
    description: "롯데택배송장양식",
    color: "#ED1C24",
    columns: [
      { key: "recipientName", header: "받는사람" },
      { key: "phoneCombined", header: "전화번호1" },
      { key: "zipCode", header: "우편번호" },
      { key: "address", header: "주소" },
      { key: "quantity", header: "수량(A타입)", defaultValue: "1" },
      { key: "productName", header: "상품명1" },
      { key: "deliveryMessage", header: "배송메시지" },
    ],
  },
];
