# T2415R — Fact-check nội dung mới của T2415

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2415 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- design-066: sửa số liệu vô căn cứ trong §Quy mô — 80.000 lượt/ngày × 40% trong khung 2 giờ (9h–11h) = 32.000 lượt → ~16.000 lượt/giờ ≈ 4,4 lượt/giây (cũ ~9.000/giờ ≈ 2,5/s không khớp).
- design-066, design-067, design-068: không tìm thấy lỗi kỹ thuật khác (optimistic locking + SKIP LOCKED, outbox + idempotency key, WAL + một sequencer/mã đều đúng nguyên lý PG 15/Spring Boot 3); ~~~seq hợp lệ; không backtick/`${` trong template literal.
- Đã chạy node scripts/build-light-index.js rồi node scripts/validate.js js/data/q-system-design.js → OK — không có lỗi.
