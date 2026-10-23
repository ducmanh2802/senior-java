# T105R — Fact-check nội dung mới của T105

Status: DONE
Agent: opencode
Owns: `js/data/q-kotlin.js`, `js/data/topics.js`, `index.html`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T105 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `kotlin-004`: làm rõ rằng `CompletableFuture` chỉ mặc định dùng executor cho các continuation async; continuation thường có thể chạy trên thread hoàn tất future. Nhấn mạnh executor tường minh cho blocking IO.
- `kotlin-005`: ghi rõ khác biệt phiên bản của `kotlin-jpa`: trước Kotlin 2.3.20 chỉ cấu hình no-arg; từ 2.3.20 bật thêm all-open preset JPA. Nêu `kotlin-spring` không tự mở entity JPA.
- Kiểm tra `node --check js/data/q-kotlin.js` và `node scripts/validate.js`: OK. Không có nội dung task bài học nên không chạy `test-lessons.js`.
