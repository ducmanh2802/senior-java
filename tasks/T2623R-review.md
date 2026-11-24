# T2623R — Fact-check nội dung mới của T2623

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2623 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- design-071: sai tên cột unique constraint (slot_time → start_time) trong **Tóm tắt** và > Senior tip; schema thực tế là `start_time` (mô hình dữ liệu, confirm, trả lời mẫu). Đã sửa cho nhất quán.
- design-072: SXSSFWorkbook/SXSSF là API ghi (write-only) của Apache POI, không dùng để đọc stream Excel; đã đổi thành XSSFReader (event model) ở seq diagram, mục Streaming parse và > Senior tip.
- design-073: không lỗi kiến thức (Outbox, idempotency key, 4xx/5xx, reconciliation, seq diagram hợp lệ).
Không markup lỗi (không backtick, không ${, ~~seq hợp lệ, 2–6 actor, bước ≤ 60 ký tự).
validate.js → OK — không có lỗi.
