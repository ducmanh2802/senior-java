# T2412R — Fact-check nội dung mới của T2412

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2412 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ nội dung mới của T2412 trong `js/data/q-banking.js` (banking-082 OMS, banking-083 order book/matching engine, banking-084 phiên ATO/ATC, banking-085 hold/T+2, banking-086 margin/force sell): cơ chế, API, mức default và số liệu đều đúng kỹ thuật (Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x); markup sạch (không backtick, không `${`, không ký tự Trung/Nhật/Hàn/Nga, không HTML thô); không chỉnh văn phong, độ dài, bố cục, không thêm/xoá mục, không sửa nội dung ở HEAD.

Lỗi kỹ thuật đã sửa theo từng id:
- banking-084 (`js/data/q-banking.js:6373`): `s.tickSize(r.symbol()).divides(price)` — `BigDecimal` không có phương thức `divides()` (API bịa). Sửa thành `price.remainder(s.tickSize(r.symbol())).compareTo(BigDecimal.ZERO) != 0`.

`node scripts/validate.js q-banking.js` → OK — không có lỗi (bao gồm kiểm tra index-light mới nhất).