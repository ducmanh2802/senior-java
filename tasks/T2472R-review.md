# T2472R — Fact-check nội dung mới của T2472

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2472 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `microservices-085`: Sửa lỗi kiến thức về Jackson default behavior. Jackson mặc định **tắt** `FAIL_ON_UNKNOWN_PROPERTIES` (bỏ qua field lạ), không phải "bật" như nội dung gốc viết. Consumer với Jackson đã là tolerant reader sẵn; chỉ khi bật cờ này mới lỗi. Đã sửa cả đoạn giải thích và mục "Lỗi hay gặp" (từ "FAIL_ON_UNKNOWN_PROPERTIES bắt" thành "enum cứng không có UNKNOWN hoặc custom deserializer ném lỗi khi gặp field lạ").
