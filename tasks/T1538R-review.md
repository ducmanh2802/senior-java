# T1538R — Fact-check nội dung mới của T1538

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1538 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chỉ cần kiến thức ĐÚC: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `sd-031` (URL shortener): không có lỗi markup/knowledge. Reference đã hoàn chỉnh: 12.189 ký tự, 11 phần ###, có ~~~seq, ~~~text, ~~~sql, Ví dụ đời thực, Trả lời mẫu, > Senior tip, 4 followups, related = ['sd-004', 'db-024', 'microservices-006'] (đều tồn tại). Seq diagram parse OK (6 actors).
- `sd-032` (WebSocket chat): đã sửa lỗi markup — seq diagram có 7 actors (vượt giới hạn 2–6 của Diagram.parseSeq) → gom Gateway A + Gateway B thành 1 actor "Gateway", điều chỉnh 7 dòng tham chiếu tương ứng. Reference đã hoàn chỉnh: 10.983 ký tự, 11 phần ###, có ~~~seq, ~~~text, Ví dụ đời thực, Trả lời mẫu, > Senior tip, 4 followups, related = ['sd-007', 'microservices-006', 'db-024'] (đều tồn tại). Seq diagram parse OK (6 actors).
- Cả 2 reference không có backtick, không có ${ (raw), {{ }} cân bằng, không có HTML tag, không có chữ nước ngoài, không có ### bị indent.