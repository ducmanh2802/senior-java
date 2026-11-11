# T1446R — Fact-check nội dung mới của T1446

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1446 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- api-029: `log server shows 94%...` → `log server cho thấy 94%...` (từ tiếng Anh lẫn vào).
- api-030: `3 triệu người dùng active` → `người dùng hoạt động`; `bỏ qua field stranger / enum stranger` → `field lạ / enum lạ`; `parser của app_old` → `parser của app cũ` (từ tiếng Anh lẫn vào).
- api-036 (rate-limit token bucket trên Redis + cache flow): đã xem xét, đúng kỹ thuật (Lua atomic, CROSSSLOT/hash tag, weak ETag không dùng cho If-Match…), không cần sửa.
- `JsonEnumDefaultValue`: giữ nguyên vì nội dung HEAD của repo đã dùng thuật ngữ này (lessons-api.js, q-scenario.js…), giữ nhất quán; không thêm/xoá mục, không sửa nội dung đã có ở HEAD.
- Đã chạy `node scripts/build-light-index.js` + `node scripts/validate.js q-api.js` → OK — không có lỗi.
