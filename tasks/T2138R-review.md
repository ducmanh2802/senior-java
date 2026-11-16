# T2138R — Fact-check nội dung mới của T2138

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2138 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa các lỗi sau trong js/data/q-api.js (theo git diff HEAD):
1. **Markup Senior tip** (api-005, api-006, api-008, api-009, api-010, api-029, api-030): Xoá khoảng trắng thừa đầu dòng trước `> Senior tip:` để render đúng blockquote.
2. **Escape sequence trong template literal** (api-009): Sửa `String etag = "\"" + ...` thành `String etag = "\\\"" + ...` ở 2 chỗ (line 605, 629) — trong template literal phải escape backslash để Java code sinh ra `\"`.
3. **Tên file validation messages** (api-025, line 2278): Sửa `messages_vi.properties` → `ValidationMessages_vi.properties` (chuẩn Spring: `ValidationMessages_<locale>.properties`).
4. **Từ vựng tiếng Việt sai ngữ cảnh** (api-031, line 3458): Sửa `KHÁM` (khám bệnh) → `tra cứu` (lookup/query DB).
5. **Chính tả tiếng Việt** (api-031, line 3580): Sửa `phỏng viên` → `phỏng vấn`.

Chạy `node scripts/validate.js` → OK. Chạy `node scripts/build-light-index.js` → OK. Chạy `node --check js/data/q-api.js` → OK (không lỗi cú pháp).