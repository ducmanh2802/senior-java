# T305 — Review bài thuật toán ByteByteGo T282/T283

Status: DONE
Agent: opencode
Owns: `js/data/algo.js`
After: T285

Commit: `ac4aa22`. Chạy sau T284/T285 (cùng file). Kiểm tra thêm: đề rõ ràng có ví dụ + ràng buộc, hints tăng dần, solution đúng độ phức tạp ghi trong `complexity`. `node scripts/test-algos.js` phải OK.

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

- Fixed missing `> Senior tip:` closing in: algo-001, algo-049, algo-050, algo-051, algo-052, algo-053, algo-054 (added concise production tip to each solution).
- Reviewed ByteByteGo algos algo-001–algo-054 and algo-069–algo-105: prompts include examples + constraints, hints progressive, complexity matches solution; no markup/backtick/${} issues; duplicates retained as committed.
- Verified: `node --check js/data/algo.js`, `node scripts/validate.js` → OK, `node scripts/test-algos.js` → 127/127 pass.

Status: DONEVerify-failed: legacy — đã commit từ trước, autopilot bỏ qua
