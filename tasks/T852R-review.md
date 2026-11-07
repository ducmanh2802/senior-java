# T852R — Fact-check nội dung mới của T852

Status: DONE
Agent: opencode
Owns: `js/data/lessons-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T852 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi sửa (chỉ nội dung mới T852, diff HEAD): `lesson-api-008`, `lesson-api-009` trong `js/data/lessons-api.js`. Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.
- Kiểm tra markup: không có backtick thô bên trong nội dung/template literal fields của 008/009, không có `${`, template literal body/starter/tests/reference/explain hợp lệ. `node --check js/data/lessons-api.js` OK.
- Kiểm tra kỹ thuật (Java 17/21, Spring Boot 3.x, Hibernate 6 context, HTTP/RFC): công thức sliding window counter và token bucket đúng (boundary burst, refill không vượt capacity, retryAfter ceil), ETag/If-Match/If-None-Match/304/412/428/409 phân biệt đúng, JPA `@Version`/optimistic locking mô tả đúng.
- `lesson-api-008` (Redis/token bucket): sửa mô tả triển khai Lua script — bỏ gợi ý "dùng {{TIME}} trong Redis" (dễ hiểu sai vì script Lua không nên tự gọi lệnh lấy giờ theo cách không xác định); làm rõ nên truyền `{{now}}` từ client vào script làm tham số để mọi instance tính trên cùng mốc và logic xác định.
- `lesson-api-008` (thuật ngữ): giải thích "retry storm" tại lần nhắc lại (bão gửi lại — nhiều client cùng retry ngay lập tức làm quá tải nặng thêm), phù hợp đối tượng dev 4 năm chưa quen.
- `lesson-api-009` (Spring): chỉnh `ShallowEtagHeaderFilter` — thay "hash MD5" (chi tiết triển khai dễ thay đổi) bằng "mã băm (hash) của response body" và làm rõ filter không xử lý `If-Match` cho PUT/PATCH chống lost update (chỉ hỗ trợ GET/304, tiết kiệm băng thông). Cập nhật câu giải thích quiz tương ứng để nhắc "optimistic concurrency (điều khiển đồng thời lạc quan)".
- Bài tập/độ xác định: giữ `nowMillis` giả, không sleep/nanoTime/IO; `lesson-api-008#1` PASS 6/6, `lesson-api-009#1` PASS 6/6 (`node scripts/test-lessons.js lesson-api-008` và `lesson-api-009`).
- Đã chạy `node scripts/build-light-index.js` (yêu cầu khi sửa lesson) → `js/data/index-light.js` cập nhật. `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo/các LỖI pre-existing ngoài phạm vi task nếu có, không phát sinh từ lessons-api).
