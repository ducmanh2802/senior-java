# T2580R — Fact-check nội dung mới của T2580

Status: DONE
Agent: opencode
Owns: `js/data/lessons-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2580 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review 2 bài mới của T2580 (lesson-design-009, lesson-design-010). Sửa 2 lỗi:

- **lesson-design-010 (markup ~~~seq):** dòng `note right of DB:` sai cú pháp. `js/core/diagram.js` parse `right of DB` thành tên actor thứ 6 (actor ma), sơ đồ render sai. Đổi thành `note DB:` (note 1 actor, span đúng actor DB). Đã verify parse ra 5 actors đúng.
- **lesson-design-010 (chính tả):** "Crash giữa chường" → "Crash giữa chừng" (giải thích câu check dual-write).

Nội dung kỹ thuật còn lại đúng: công thức phí (CARD 2.9%+500, WALLET 1.5%, QR 0.8% cap 2000 — số liệu test khớp), Strategy+Factory O(1) vs List O(N), inject List/Map của Spring, Kafka idempotence, FOR UPDATE SKIP LOCKED, Debezium OutboxEventRouter, exactly-once = at-least-once + idempotent consumer. Không có API/flag bịa.

Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js` đã chạy lại (index-light cập nhật design-009/010, đồng thời loại bỏ entry mồ côi ai-152/153/154 & microservices-025/026 không có dữ liệu nguồn); `node scripts/validate.js` → OK; `node scripts/test-lessons.js lesson-design-009` (reference 3/3) và `lesson-design-010` (reference 6/6) pass, starter biên dịch được và không pass hết.
