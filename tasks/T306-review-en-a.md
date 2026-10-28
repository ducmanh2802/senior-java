# T306 — Review bản dịch EN (nhóm A: T227, T256–T268)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-2.en.js`, `js/i18n/labs-sql-2.en.js`, `js/i18n/labs-incident-2.en.js`, `js/i18n/labs-incident-3.en.js`, `js/i18n/lessons-collections-1.en.js`, `js/i18n/lessons-collections-4.en.js`, `js/i18n/lessons-core-1.en.js`, `js/i18n/lessons-modern-1.en.js`, `js/i18n/lessons-modern-2.en.js`

Commit: `14026a6`, `412e521`. Bản dịch tiếng Anh: so với bản gốc tiếng Việt trong `js/data/` cùng id — đủ ý, đúng thuật ngữ, tiếng Anh tự nhiên, không sót đoạn tiếng Việt, code giữ nguyên, key/id khớp bản gốc.

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
- lessons-collections-004: EN was a shallow/mismatched stub; rewrote full translation to match source (body, 2 exercises, 3 checks) — code unchanged.
- lessons-core-001: removed leftover Vietnamese in Java string literal ("Không thể thanh toán" → "Could not process payment").
- Other owned files (quiz-2, labs-sql-2, labs-incident-2/3, lessons-collections-1, lessons-modern-1/2): reviewed, markup/keys/code counts match source; no issues found.

Status: DONE
Reviewed-by: check-i18n (translation, no LLM review)
