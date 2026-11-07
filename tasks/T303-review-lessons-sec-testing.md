# T303 — Review lessons T296 (security) + T297 (testing)

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`, `js/data/lessons-testing.js`

Commit: `72c9bf3`, `4460947`. Lưu ý: đặc tả T297 có nhiều chữ rác ([sic]) — kiểm tra kỹ `lesson-testing-004` không bị ảnh hưởng.

Đây là task **review + sửa tại chỗ** cho nội dung đã commit nhưng CHƯA được ai kiểm tra chất lượng (xem AGENTS.md mục 4–6, 12). Integrator cho phép sửa đúng các file trong `Owns`.

Cách làm:
1. Tìm các mục được thêm trong commit nêu dưới: `git show <commit> -- <file>` (chỉ review phần mới thêm, không viết lại câu cũ).
2. Với từng mục, kiểm tra và **sửa trực tiếp**:
   - Sai kỹ thuật so với Java 17/21, Spring Boot 3.x, Hibernate 6, AWS hiện hành; API bịa → sửa cho đúng hoặc viết ít lại nhưng đúng.
   - Chữ bị lỗi/rác (ký tự Trung/Hàn lạc vào, câu cụt, từ vô nghĩa, `[sic]`), lặp ý, markup sai (backtick, `${`, bảng vỡ, code block thiếu ngôn ngữ).
   - Thiếu chuẩn: `**Tóm tắt:**` mở đầu, các mục `###`, `> Senior tip:` cuối; lesson phải có `### Liên hệ phỏng vấn`, `explain` của check nói vì sao từng phương án sai.
   - Không xoá mục, không đổi `id`, không thêm field lạ.
3. Kiểm chứng: `node --check <file>`, `node scripts/validate.js` → `OK — không có lỗi.` (nếu chỉ còn lỗi ở file ngoài Owns thì ghi lại); file lessons: `node scripts/test-lessons.js` phải pass hết (reference pass 100%, starter không pass hết).
4. Ghi vào `## Notes`: danh sách id đã sửa + sửa gì (1 dòng/id), id đã ổn. Rồi `Status: DONE`.

## Notes
- lesson-security-004: thêm `**Tóm tắt:**` đầu body, thêm `> Senior tip:` trước "Liên hệ phỏng vấn", sửa typo "CSRF webpack" → "CSRF check"
- lesson-security-005: thêm `**Tóm tắt:**` đầu body, thêm `> Senior tip:` trước "Liên hệ phỏng vấn"
- lesson-testing-004: đã đủ chuẩn (`**Tóm tắt:**`, `###`, `> Senior tip:`, `### Liên hệ phỏng việc`), không có `[sic]` hay chữ rác, không sửa
- `node --check` cả hai file OK; `node scripts/test-lessons.js` pass 91/91; `node scripts/validate.js` chỉ báo lỗi ở `algo.js` (ngoài Owns) và cảnh báo `path.js` (ngoài Owns)

