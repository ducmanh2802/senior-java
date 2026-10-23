# T106R — Fact-check nội dung mới của T106

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`, `js/data/q-concurrency-jvm.js`, `js/data/q-spring-data.js`, `js/data/q-microservices.js`, `js/data/q-system-design.js`, `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T106 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `q-scenario.js`: rà nội dung đã sửa và scenario-045–056; scenario-001 bỏ tỷ lệ tối ưu index không có căn cứ, scenario-002 sửa độ phức tạp keyset thành O(log n + pageSize) với index phù hợp, scenario-005 bỏ thống kê deadlock tùy trải nghiệm cá nhân, scenario-006 ghi rõ heuristic Hikari không phải công thức sizing phổ quát, scenario-007/031 bỏ khẳng định retention 5 năm áp dụng chung, scenario-011 bỏ part size/concurrency “tối ưu” không có đo đạc, scenario-016 diễn đạt restart định kỳ là biện pháp tạm có giám sát. Scenario mới 045–056 được rà outbox, EOD, maker-checker, log masking, quota/coupon, Redis, Kafka, upload S3 và multi-region; bỏ refs mới không xác minh được.
- `q-system-design.js`: `design-014` làm rõ đặc tả switch/settlement; `design-015` giới hạn cách dùng PostgreSQL sequence cấp block; `design-017` nêu điều kiện deterministic replay; `design-018` sửa phát biểu SQL prefix search; `design-019` giới hạn cam kết Kafka buffering; `design-020` ghi rõ bucket velocity là xấp xỉ và cần atomicity/dedup; `design-021` sửa chống khóa tài khoản qua OTP. `architecture-009`, `architecture-013`–`architecture-018`, `architecture-021`–`architecture-022`: sửa hướng phụ thuộc ArchUnit, cấu hình empty rule, tenant trust boundary, RLS với connection pool và schema registry. Bỏ refs AWS/SRE/PostgreSQL bị lặp máy móc, không gắn với câu hỏi.
- Kiểm tra syntax hai file bằng `node --check`; `node scripts/validate.js` in `OK — không có lỗi.`; `git diff --check` sạch. `node scripts/check-links.mjs q-scenario.js` không thể xác minh URL vì sandbox trả `EACCES` cho mọi request mạng; các refs mới không chắc chắn đã được bỏ.
