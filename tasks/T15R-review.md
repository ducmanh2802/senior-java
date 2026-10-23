# T15R — Fact-check nội dung mới của T15

Status: DONE
Agent: opencode
Owns: `js/views/algo.js`, `css/views/algo.css`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T15 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
`js/views/algo.js`: xác nhận `App.code.hasTests/assemble/parse`, `App.ai.run/review` và `App.ui.runResult/codeFeedback/error` khớp API tại `js/core/ai.js`; Java 13 đúng với Judge0 mặc định (language id 62) và ghi chú ở đặc tả T20. Dùng `algo.starter` khi có, khôi phục kết quả theo đúng nội dung editor; bỏ kết quả cũ khi code đổi và ngăn kết quả async cũ ghi đè UI/cache sau khi sửa code. Khôi phục mã hóa tiếng Việt bị hỏng trong phần mới. Không có lab/bài học trong phạm vi này.

`css/views/algo.css`: giữ style panel hiện có; không cần thay đổi.

Kiểm tra: `node --check js/views/algo.js`; `node scripts/validate.js` → OK.
