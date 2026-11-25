# T2709R — Fact-check nội dung mới của T2709

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2709 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 3 câu hỏi mới (core-083, core-084, core-085):
- core-083: G1 String Deduplication — flag `-XX:+UseStringDeduplication`, age threshold mặc định 3, chỉ chạy G1, khác compact strings (Java 9+), trade-off CPU/pause vs heap. Kỹ thuật chính xác.
- core-084: Exception Translation — wrap SQLException→DataAccessException→BusinessException, giữ cause, retry 5xx/4xx, idempotency key, try-with-resources suppressed exception. Kỹ thuật chính xác.
- core-085: PECS Generics — Producer Extends, Consumer Super, invariance List<Object>/List<String>, Collections.copy signature, wildcard capture helper method. Kỹ thuật chính xác.
Tất cả refs trỏ đến tài liệu Oracle chính thức hợp lệ. Không có lỗi kỹ thuật, markup, hay từ lẫn ngôn ngữ. validate.js OK cho 3 câu hỏi này.
