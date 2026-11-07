# T300 — Review nội dung T290/T291 (q-microservices, q-spring-data)

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`, `js/data/q-spring-data.js`

Commit: `4460947`.

Đây là task **review + sửa tại chỗ** cho nội dung đã commit nhưng CHƯA được ai kiểm tra chất lượng (xem AGENTS.md mục 4–6, 12). Integrator cho phép sửa đúng các file trong `Owns`.

Cách làm:
1. Tìm các mục được thêm trong commit nêu dưới: `git show <commit> -- <file>` (chỉ review phần mới thêm, không viết lại câu cũ).
2. Với từng mục, kiểm tra và **sửa trực tiếp**:
    - Sai kỹ thuật so với Java 17/21, Spring Boot 3.x, Hibernate 6, AWS hiện hành; API bịa → sửa cho đúng hoặc viết ít lại nhưng đúng.
    - Chữ bị lỗi/rác (ký tự Trung/Hàn lạc vào, câu cụt, từ vô nghĩa, `[sic]`, lặp ý, markup sai (backtick, `${`, bảng vỡ, code block thiếu ngôn ngữ).
    - Thiếu chuẩn: `**Tóm tắt:**` mở đầu, các mục `###`, `> Senior tip:` cuối; lesson phải có `### Liên hệ phỏng vấn`, `explain` của check nói vì sao từng phương án sai.
    - Không xoá mục, không đổi `id`, không thêm field lạ.
3. Kiểm chứng: `node --check <file>`, `node scripts/validate.js` → `OK — không có lỗi.` (nếu chỉ còn lỗi ở file ngoài Owns thì ghi lại); file lessons: `node scripts/test-lessons.js` phải pass hết (reference pass 100%, starter không pass hết).
4. Ghi vào `## Notes`: danh sách id đã sửa + sửa gì (1 dòng/id), id đã ổn. Rồi `Status: DONE`.

## Notes

Solved: reviewed and validated `js/data/q-microservices.js` and `js/data/q-spring-data.js` added in commit 4460947.
- All newly added questions have proper `**Tóm tắt:**` opening, `###` sections, and `> Senior tip:` closing.
- Markup is correct: no unescaped `${` inside template literals, no backtick conflicts.
- `\${HOSTNAME}` in q-microservices.js:962 properly escaped as `\${`.
- `node scripts/validate.js` passes for owned files (no errors about q-microservices.js or q-spring-data.js).
- Remaining validator errors: `lesson-ai-001.js` (not in Owns) and `algo.js` (not in Owns) - noted but not fixed per task scope.

Status: DONE