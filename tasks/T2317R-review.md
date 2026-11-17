# T2317R — Fact-check nội dung mới của T2317

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2317 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Review diff HEAD vs working cho `js/data/quiz-spring.js` (mục mới: qz-spring-021..024, qz-jpa-021..024, qz-db-021..024, qz-api-023..025 đã chỉnh, và qz-spring-066..085 thêm mới). Không thêm/xoá mục, không sửa nội dung đã có ở HEAD ngoài diff.
- `qz-spring-080`: sửa cơ chế `onStatus` sai — RestClient áp dụng status handler theo **thứ tự đăng ký** (handler đăng ký trước được xét trước), handler mặc định chạy cuối; trước đó mô tả ngược ("thứ tự ngược, đăng ký sau xét trước") có thể khiến người đọc cấu hình sai.
- `qz-spring-082`: bỏ khẳng định sai "handler mặc định của Boot (order 0)" và nêu đúng điều kiện ưu tiên khi `@RestControllerAdvice` và handler mặc định cùng xử lý exception (cần đảm bảo advice được ưu tiên hơn).
- `qz-db-023`: sửa ví dụ MySQL functional index trong tip — `date_trunc('day', created_at)` là hàm PostgreSQL, không hợp lệ cho MySQL; đổi thành `DAY(created_at)` (ví dụ `CREATE INDEX idx ON events ((DAY(created_at)))`, cú pháp hai ngoặc, MySQL 8.0.13+), giữ đúng bản chất "không bọc cột đã index trong hàm".
- Các mục mới còn lại: kiểm tra không thấy lỗi kỹ thuật/API/flag/mặc định/cơ chế ngược/số liệu vô căn cứ theo chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15.
- Đã chạy `node scripts/build-light-index.js` và `node --check js/data/quiz-spring.js`. `node scripts/validate.js` vẫn FAIL do lỗi pre-existing ở file ngoài phạm vi sở hữu (q-banking.js, quiz-design.js, sdlc.js, quiz-ops.js, quiz-ccap-2.js, bugs.js, lessons-banking.js, path.js); không có lỗi nào thuộc `js/data/quiz-spring.js`. `scripts/test-lessons.js` không áp dụng (không phải bài học). Không git commit, không mở trình duyệt, không kill process theo tên.
