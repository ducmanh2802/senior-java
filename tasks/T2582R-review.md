# T2582R — Fact-check nội dung mới của T2582

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2582 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Fact-check 3 câu hỏi mới (behavioral-081, behavioral-082, behavioral-083): nội dung đúng kỹ thuật, không lỗi kiến thức, markup hợp lệ, không backtick/`${`, sequence diagram đúng cú pháp.
- `@MockitoBean` (Boot 3.4+) đã được dùng đúng, phù hợp chuẩn Java 17/21, Spring Boot 3.x.
- Đã chạy `node scripts/build-light-index.js` → ghi `js/data/index-light.js` (394.4 KB).
- `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo về độ dài đáp án ở q-concurrency-jvm.js và q-spring-data.js là có sẵn từ trước, không phải của task này).
