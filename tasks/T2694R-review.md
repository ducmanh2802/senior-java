# T2694R — Fact-check nội dung mới của T2694

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2694 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi kỹ thuật trong 3 câu hỏi mới:

1. **jpa-090**: Sửa indentation YAML - `datasource:` phải nằm dưới `spring:` chứ không cùng cấp.

2. **jpa-092**: Sửa mô tả sai về TTL trong CacheConcurrencyStrategy:
   - READ_ONLY: dữ liệu không đổi, không dùng TTL (cache provider có thể có expiry nhưng không phải cơ chế của strategy)
   - READ_WRITE: dùng invalidation khi ghi, không dùng TTL
   - NONSTRICT_READ_WRITE: strategy chấp nhận stale data, thường cấu hợp TTL ở cache provider
   - Đã sửa ở 3 chỗ: mô tả strategy, ví dụ đời thực, pitfall production, và trả lời phỏng vấn.

3. **jpa-092**: Sửa cơ chế invalidate - Hibernate invalidate entry khi ghi, TTL là cơ chế của cache provider, không phải Hibernate tự hết TTL.

Validation `node scripts/validate.js` chạy OK cho file q-spring-data.js (các lỗi khác là pre-existing ở file khác). `node --check js/data/q-spring-data.js` pass.
