# T2327R — Fact-check nội dung mới của T2327

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2327 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `api-069`: sửa cấu hình Spring Cloud Gateway `RequestRateLimiter` sai đơn vị — `redis-rate-limiter.replenishRate` là token/giây (không phải /phút), đổi `600` → `10` (=600/phút) và `burstCapacity` `600` → `60` để burst không vượt sức chịu backend; thay ví dụ `HeaderKeyResolver` (không phải class có sẵn) bằng `KeyResolver` tự viết trả `Mono.just(apiKey)` và 401 khi thiếu header.
- `api-067`, `api-068`, `api-070`, `api-071`, `api-061`–`api-066`: kiểm tra nội dung mới trong diff, không phát hiện lỗi kỹ thuật rõ ràng (API/flag bịa, cơ chế sai, status/idempotency/SSRF/HMAC/contract-first hợp lý với Java 17/21, Spring Boot 3.x). Không chỉnh văn phong/độ dài.
- `node --check js/data/q-api.js`: OK. `node scripts/build-light-index.js`: đã chạy. `node scripts/validate.js`: báo lỗi sẵn có ngoài phạm vi sở hữu (`q-security-part.js` chưa khai báo manifest, lỗi inline code lồng `{}` trong `quiz-design.js`, cảnh báo path) — không thấy lỗi mới từ `js/data/q-api.js`.
