# T1418R — Fact-check nội dung mới của T1418

Status: DONE
Agent: opencode
Owns: `js/data/lessons-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1418 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `lesson-design-003` (phần mới, mục "Lỗi hay gặp trên production" #2): sửa khẳng định sai về `String.hashCode()` "phụ thuộc JVM implementation (Java 8 vs 11 vs 21 có thể khác nếu seed đổi)". `String.hashCode()` có công thức hợp đồng trong `String` (xác định, ổn định cho cùng nội dung chuỗi qua các bản Java); lý do production phải chuẩn hoá hash ring là bit width/phân phối/encoding và nhất quán thuật toán giữa các service, không phải do `hashCode` đổi theo bản Java.
- Đã rà soát các phần mới còn lại (consistent hashing lookup/TreeMap/vnode/collision/movement; circuit breaker count/time window, sliding window, allow/fail-fast/timeout/retry/HALF_OPEN probe): không phát hiện lỗi kỹ thuật/markup/cú pháp khác.
- `node --check js/data/lessons-design.js` OK. `node scripts/validate.js` → OK. `node scripts/test-lessons.js` → Lesson exercises OK (220/220, 197 bài học, 220 từ cache).
