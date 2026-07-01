# invoice-converter

쇼핑몰·결제 수단별 주문 엑셀을 택배사 업로드 양식으로 변환하는 웹 도구.

## 기능

- 카페24, 네이버페이 등 여러 출처의 주문 엑셀 동시 업로드
- CJ대한통운, 한진, 롯데, 우체국 택배 양식으로 변환
- 브라우저에서만 처리 (서버 업로드 없음)

## 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 기술 스택

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4
- SheetJS (xlsx)
