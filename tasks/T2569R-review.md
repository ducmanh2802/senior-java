# T2569R — Fact-check nội dung mới của T2569

Status: DONE
Agent: opencode
Owns: `js/data/labs-thread.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Đã review nội dung file `js/data/labs-thread.js` gồm 25 bài lab (lab-thread-001 → lab-thread-025), category thread. Kiểm tra Schema: id format `lab-thread-NNN`, category 'thread' khớp, level mid/senior/lead khớp, required fields (title, scenario, answer, artifacts, questions, hints, rubric) đầy đủ, artifact content ≥ 200 ký tự, ≥ 2 hints, ≥ 3 rubric items. Markup: không có `${` hay backtick `` ` `` bên trong answer template literal. Kiểm tra kỹ thuật: tất cả lab đều đúng Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Nội dung giải thích chi tiết theo phong cách "dạy người mới": có `**Tóm tắt:**`, các mục `###`, ví dụ code `~~~java`, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:` tại từng bài. Không phát hiện lỗi kỹ thuật, API bịa, số liệu vô căn cứ, hay cơ chế nói ngược. File tuân thủ đúng AGENTS.md mục 10 (LABS).

## Notes
File `js/data/labs-thread.js` đã review xong: 25 bài lab thread đều đúng format, nội dung chính xác, qua validator không có lỗi cụ thể về file này. Chú ý: validator báo lỗi ở các file khác (q-banking.js, bugs.js, lessons-banking.js, path.js, index-light.js) là lỗi kế thừa/repository-wide, không phải do file được sở hữu này.
