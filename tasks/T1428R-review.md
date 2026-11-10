# T1428R — Fact-check nội dung mới của T1428

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1428 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Sửa `lesson-spring-007` (Jackson): Sai về mặc định của `DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES`. Nội dung cũ ghi "Spring Boot tắt cờ này mặc định" — thực tế Spring Boot **giữ** mặc định Jackson là **bật** (`true`); có thể tắt qua `spring.jackson.deserialization.fail-on-unknown-properties=false`. Đã sửa dòng 984 trong `js/data/lessons-spring.js`.
- `node scripts/validate.js` → OK
- `node scripts/test-lessons.js` → 219/219 pass
