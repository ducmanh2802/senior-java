# T111 — Thêm 40 câu trắc nghiệm + sửa thiên lệch đáp án behavioral

Status: TODO
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6. (1) Thêm **40 câu** cho các topic đang ít/không có quiz: `sql`, `security`, `api`, `devops`, `kotlin`, `design`, `microservices` (~6 mỗi topic), id `qz-<topic>-NNN` tiếp theo. Đáp án đúng rải đều 0–3; explain nói vì sao từng phương án sai.
(2) Ở các câu `qz-behavioral-*` có sẵn: đáp án đúng thường DÀI hơn hẳn các phương án sai (đoán được bằng độ dài). Viết lại các phương án SAI cho dài tương đương và nghe hợp lý, KHÔNG đổi câu hỏi, đáp án đúng hay `answer`.
`node scripts/validate.js` → OK.

## Notes
