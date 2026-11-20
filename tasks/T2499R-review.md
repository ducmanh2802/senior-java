# T2499R — Fact-check nội dung mới của T2499

Status: DONE
Agent: opencode
Owns: `js/data/q-frontend.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2499 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 5 câu hỏi trong `js/data/q-frontend.js` (frontend-001 đến frontend-005):

**frontend-001 (Event Loop):**
- Sửa so sánh Java Executor: bỏ từ "song song" (mâu thuẫn với single-threaded), rõ ràng hơn về bản chất đơn luồng.
- Sửa "vi microtask chay truoc su kien chuot" → "trước vẽ giao diện (render là một macrotask)" - chuột là macrotask, không phải microtask chạy trước chuột.
- Thêm dấu tiếng Việt (diacritics) cho toàn bộ câu trả lời.

**frontend-002 (async/await):**
- Sửa typo "duong hoa mi" → "dễ hiểu hơn".
- Thêm dấu tiếng Việt cho toàn bộ câu trả lời.

**frontend-003 (Closure & this):**
- Sửa so sánh Java lambda vs arrow function: Java lambda kế thừa `this` từ class bao quanh, arrow function kế thừa `this` từ phạm vi từ vựng (lexical scope - có thể là function, không nhất thiết class).
- Thêm dấu tiếng Việt cho toàn bộ câu trả lời.

**frontend-004 (== vs ===):**
- Sửa ví dụ đời thực mâu thuẩn: ví dụ cũ gợi ý `==` tốt hơn `===` khi so sánh chuỗi '0' với số 0, nhưng Senior tip lại khuyên dùng `===`. Đã sửa rõ: nên parse sang số trước rồi mới so sánh bằng `===`.
- Thêm dấu tiếng Việt cho toàn bộ câu trả lời.

**frontend-005 (ES Modules & Vite):**
- Sửa typo "Vet" → "Vite" trong câu trả lời phỏng vấn.
- Thêm dấu tiếng Việt cho toàn bộ câu trả lời.

**Lưu ý:** Validation báo lỗi `topic "frontend" không có trong topics.js` cho 5 câu hỏi - đây là vấn đề của file `topics.js` (do integrator sở hữu), cần thêm topic `frontend` vào registry. Các lỗi validation khác (q-sql.js, q-microservices.js, q-system-design.js, bugs.js, lessons-*.js, projects.js, path.js) là lỗi tiền đề có sẵn trong repo, không liên quan đến thay đổi của task này. Cú pháp file `q-frontend.js` đã kiểm tra `node --check` → OK.