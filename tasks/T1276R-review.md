# T1276R — Fact-check nội dung mới của T1276

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1276 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Đã review toàn bộ nội dung mới thêm của T1276 (6 block "### Ví dụ đời thực", ids microservices-013 → 018, xem `git diff HEAD -- js/data/q-microservices.js`). Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.
- Lỗi kỹ thuật đã sửa (theo từng id):
  - microservices-013: tên metric `{{resilience4j.circuitbreaker.failure.rate}}` không chuẩn (Resilience4j/Micrometer không có metric này) → viết bằng chữ "tỉ lệ lỗi 70%, circuit breaker (phía order-service gọi payment-service) mở"; làm rõ chuỗi sự cố: order-service nhận 401 từ payment-service/IdP, retry gây tải dồn (cascade 5xx).
  - microservices-014: `{{JSONException: Value at status is not a string}}` không phải exception của Spring Boot 3/Jackson → đổi thành `{{com.fasterxml.jackson.databind.exc.MismatchedInputException}}` (status nhận object, mong đợi string).
  - microservices-016: "dùng gh-ost cho backfill" sai — gh-ost chỉ chạy trên MySQL, ngữ cảnh bài là PostgreSQL (`pg_stat_activity`, `AccessExclusiveLock`, `CREATE INDEX CONCURRENTLY`) → đổi thành backfill theo lô `UPDATE ... WHERE id BETWEEN ... AND discount_id IS NULL` 5.000 dòng/lần, nghỉ 100ms/lần; làm rõ WAL/slot ("replica không áp kịp WAL, replication slot giữ WAL").
- `node --check js/data/q-microservices.js` → OK.
- `node scripts/build-light-index.js` → sinh lại `js/data/index-light.js`.
- `node scripts/validate.js` → file sở hữu (microservices) không báo lỗi. Lỗi còn lại là của file KHÔNG sở hữu và tồn tại trước session này: `q-claude.js` (claude-017, inline code chứa `{ }` lồng nhau) và `lessons-testing.js` (lesson-testing-005, cùng lỗi) → không sửa theo luật 3 AGENTS.md (chỉ sửa file task sở hữu).
