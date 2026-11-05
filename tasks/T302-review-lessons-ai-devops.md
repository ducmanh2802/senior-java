# T302 — Review lessons T294 (ai) + T295 (devops/ECM)

Status: DONE
Agent: opencode
Owns: `js/data/lessons-ai.js`, `js/data/lessons-devops.js`

Commit: `4460947`, `72c9bf3`.

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
- lesson-devops-003: sửa lỗi thụt đầu dòng (2 spaces) trên bảng so sánh và danh sách `1.`/`-` trong `body` — bảng/lists bị vỡ khi `App.md` render (yêu cầu `|`, `###`, `- `, `1. ` tại cột 0).
- lesson-devops-004: sửa thụt đầu dòng (3 spaces) các mục `-` trong `body` và `prompt`.
- lesson-devops-005: sửa thụt đầu dòng (3–4 spaces) các mục `-` trong `body`.
- lesson-devops-001, lesson-devops-002: ổn, markup sạch, không cần sửa (không thuộc commit review).
- lessons-ai.js: file đang trống (`push()` không có bài) — không có lesson nào được commit vào track `ai` (T294 nêu lesson-ai-001/002 nhưng chúng không tồn tại trong `lessons-ai.js`; `lesson-ai-001.js` chỉ có trong HEAD, đã bị xóa trong working tree và không được `index.html` nạp). Không có mục để review; cú pháp hợp lệ, `validate` sạch.
- Lỗi ngoài Owns (không được sửa theo luật 3): `js/data/algo.js` có lỗi cú pháp ("missing ) after argument list") khiến `validate.js` dừng với 1 LỖI; file không thuộc T302, integrator cần xem xét.
- Kiểm chứng: `node --check` cả 2 file OK; `validate.js` không báo lỗi trong file sở hữu (còn 1 lỗi algo.js ngoài Owns); `test-lessons.js` 91/91 OK (devops-004 5/5, devops-005 4/4, biên dịch thật JDK 17; reference pass 100%, starter không pass hết).
