# T1436R — Fact-check nội dung mới của T1436

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1436 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-check diff `HEAD -- js/data/q-english.js` (T1436, commit b11f180): thay đổi chủ yếu ở `english-019,024,025,026,028,033,034,035` (rút gọn phrase/mistake/tip) và viết lại `english-036..041`. Không phát hiện lỗi kỹ thuật/API/flag/mặc định/số liệu sai, không có markup lỗi (backtick/`${` không escape) trong phần nội dung mới.
- **Sửa cấu trúc (schema):** `english-036..041` trong bản rewrite bị mất `follow`, `tags`, `lang` (kết thúc `\`,},`). Đã khôi phục `follow`/`tags`/`lang` nguyên bản từ HEAD cho 6 câu này để đáp ứng schema/không thêm-xoá mục ngoài phạm vi fact-check.
- Đã chạy `node scripts/build-light-index.js` (bắt buộc sau sửa câu hỏi) và `node scripts/validate.js` → **OK** (chỉ còn cảnh báo sẵn có `path.js: lesson-design-007`). `node --check js/data/q-english.js` OK.
- Lưu ý: working tree có nhiều file modified khác (không thuộc T1436R); chỉ `js/data/q-english.js`, `js/data/index-light.js` (rebuild theo rule 6) và `tasks/T1436R-review.md` là thay đổi do task này.
