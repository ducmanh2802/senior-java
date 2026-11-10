# T1413R — Fact-check nội dung mới của T1413

Status: DONE
Agent: opencode
Owns: `js/data/lessons-testing.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1413 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check toàn bộ `js/data/lessons-testing.js` (7 bài học: lesson-testing-001..007). Kiến thức kỹ thuật đúng, không có API/flag bịa, cơ chế và số liệu chính xác.

Sửa 1 lỗi markup:
- `lesson-testing-005` (Characterization test): dòng `> Senior tip:` có `{{}}` rỗng — "hãy diff file {{}} như diff code" — là placeholder không hợp lệ trong markup (không có nội dung). Sửa thành "hãy diff file golden master như diff code". Đây là lỗi cú pháp markup duy nhất; không có backtick, `${`, `~~~seq` nào bị vỡ.

Kiểm tra lại:
- `node scripts/validate.js` → `OK — không có lỗi.`
- `node scripts/test-lessons.js` → `Lesson exercises OK: 220/220`

Không có lỗi kiến thức cần sửa; nội dung đã có ở HEAD được giữ nguyên, chỉ sửa markup.
