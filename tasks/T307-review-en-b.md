# T307 — Review bản dịch EN (nhóm B: T269–T278)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-concurrency-1.en.js`, `js/i18n/lessons-concurrency-2.en.js`, `js/i18n/lessons-concurrency-3.en.js`, `js/i18n/lessons-concurrency-4.en.js`, `js/i18n/lessons-spring-1.en.js`, `js/i18n/lessons-jpa-1.en.js`, `js/i18n/lessons-microservices-2.en.js`, `js/i18n/lessons-db-1.en.js`

Commit: `14026a6`. Bản dịch tiếng Anh: so với bản gốc tiếng Việt trong `js/data/` cùng id — đủ ý, đúng thuật ngữ, tiếng Anh tự nhiên, không sót đoạn tiếng Việt, code giữ nguyên, key/id khớp bản gốc.

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
- lesson-concurrency-001..005: EN overlay reviewed; syntax/markup OK.
- lesson-spring-001..005: EN overlay reviewed; syntax/markup OK.
- lesson-jpa-001..005: EN overlay reviewed; syntax/markup OK.
- lesson-microservices-005: EN overlay reviewed; syntax/markup OK.
- lesson-db-001: fixed missing closing `});` and corrected header id list; `node --check` OK.
All owned files pass `node --check`; `node scripts/validate.js` → OK; `node scripts/test-lessons.js` → 91/91.
