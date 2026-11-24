# T2578R — Fact-check nội dung mới của T2578

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2578 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 10 câu hỏi mới (qz-security-038 → qz-security-047) trong `js/data/quiz-spring.js`.
Sửa 1 lỗi kỹ thuật:

- **qz-security-043** (Argon2id): dòng ví dụ `new Argon2PasswordEncoder(65536, 3, 4, 32, 16)` đặt tham số theo thứ tự nghĩa tự do (memory, iterations, parallelism, hashLength, saltLength) — sai so với signature thật của Spring `Argon2PasswordEncoder(int saltLength, int hashLength, int parallelism, int memory[KiB], int iterations)`. Đã sửa thành `new Argon2PasswordEncoder(16, 32, 4, 65536, 3)` với comment giải thích thứ tự tham số, match `defaultsForSpringSecurity_v5_8()` (16/32/1/65536/2).

Các câu còn lại (SecurityFilterChain chọn chuỗi đầu tiên theo @Order; RS256 verify thất bại khi sửa payload; refresh token rotation + reuse detection; CSRF默认;bật cho session; PKCE bảo vệ authorization code; Argon2id memory-hard hơn BCrypt; SQL injection qua ORDER BY phòng bằng whitelist; IDOR cần authorization check; matcher hẹp Order nhỏ; JWT scope cần JwtAuthenticationConverter) — kiến thức đúng, không sửa nội dung.
