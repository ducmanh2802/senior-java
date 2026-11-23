# T2561R — Fact-check nội dung mới của T2561

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2561 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ nội dung mới của T2561 trong `js/data/q-microservices.js` (3 câu hỏi mới: microservices-123, 124, 125). Lỗi kỹ thuật đã sửa, theo id:

- **microservices-123** (SAP–MES integration):
  - `có.commit/rollback` → `có commit/rollback` (lỗi đánh máy trong thuật ngữ BAPI).
  - `IDoc WM_GOODS_MVT` → `IDoc MBGMCR`: `WM_GOODS_MVT` không phải tên IDoc tiêu chuẩn SAP (IDoc hàng hóa thực tế là MBGMCR0x/WMMBID0x, đã đối chiếu danh sách IDoc SAP), chỉ giữ ở ví dụ đời thực.
  - Xóa 2 ref không chắc chắn tồn tại (`help.sap.com/docs/SAP_INTEGRATION`, `blogs.sap.com/2021/09/15/…`) theo quy tắc refs "không chắc thì bỏ, đừng đoán".
- **microservices-124** (OPC-UA/MQTT gateway):
  - `AttributeId.Value.uid()` → `AttributeId.Value`: Milo không có method `.uid()` trên `AttributeId`, đây là API bịa.
- **microservices-125** (MES–ERP exactly-once):
  - `IDoc 'WM_GOODS_MVT'` → `IDoc 'MBGMCR'` trong mô hình middleware (cùng lý do trên).
  - Xóa ref `help.sap.com/docs/SAP_ERP/BAPI_GOODSMVT_CREATE` (không chắc tồn tại); giữ 2 ref đã xác minh (microservices.io outbox pattern, Confluent exactly-once).
- Không chỉnh văn phong, độ dài, bố cục; không thêm/xoá mục; không sửa nội dung đã có ở HEAD.
- `node scripts/validate.js` → `OK — không có lỗi.` (xem log). `index-light.js` đã chứa 3 id mới (123/124/125), không cần rebuild.
- Cảnh báo còn lại của validate.js (`q-concurrency-jvm.js`, `q-spring-data.js`: đáp án ngắn; `path.js`: lesson không trong PATH) nằm trong file không thuộc quyền sở hữu task này, không sửa theo quy tắc 3 AGENTS.md.
