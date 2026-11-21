# T2556R — Fact-check nội dung mới của T2556

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2556 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 4 câu mới (scenario-181..184) trong `js/data/q-scenario.js`. Lỗi đã sửa theo id:

- **scenario-181**:
  - Backtick + property bịa: `server.tomcat.threads.virtual=true` (không tồn tại) → `{{spring.threads.virtual.enabled=true}}` (đúng: Spring Boot 3.2+ bật virtual thread qua `spring.threads.virtual.enabled`). Backtick trong template literal làm vỡ file → đã bỏ.
  - Cơ chế nói ngược: SseEmitter chạy trên async servlet nên KHÔNG giữ thread Tomcat (thread trả về pool khi mở kết nối); virtual threads chỉ cần khi dùng servlet blocking. Sửa ở cả mục Pitfall và Trả lời mẫu.
  - Số liệu mâu thuẫn: "200 request/5s" (=40 req/s) nhưng ví dụ ghi "DB 200 QPS" → sửa ví dụ thành polling mỗi 5s với 200 màn hình = 40 QPS.
- **scenario-182**:
  - Backtick `AckMode.BATCH` / `RECORD` trong template literal → `{{AckMode.BATCH}}` / `{{RECORD}}`.
  - Kiểm tra: `jdbcTemplate.batchUpdate(sql, batch, 1000, (ps,e)->...)` đúng overload `ParameterizedPreparedStatementSetter`; 5.000 rec/s = 432 triệu/ngày đúng; `ON CONFLICT ... DO NOTHING` đúng cú pháp PostgreSQL — không sửa.
- **scenario-183**:
  - Recursive CTE: anchor SELECT tham chiếu cột `depth` không có trong bảng → thêm `0 AS depth`.
  - Hướng duyệt ngược: `ON g.serial = t.parent_serial` (đi lên cha) → `ON g.parent_serial = t.serial` (đi xuống linh kiện), khớp mục "ngược về nguyên liệu".
  - `WHERE serial = 'X'` → `WHERE serial = ?` cho khớp `jdbc.query(TRACE_SQL, serial)`.
  - Prose schema: `(parent_serial, child_serial, lot, ...)` → `(serial, parent_serial, lot, ...)` cho khớp cột trong SQL.
- **scenario-184**:
  - Chữ nước ngoài lẫn: "hai môi trường identical" → "hai môi trường giống hệt nhau".
  - Bổ sung cảnh báo đúng cho Flyway: `CREATE INDEX CONCURRENTLY` không chạy được trong transaction (Flyway mặc định bọc transaction) → cần `executeInTransaction=false` hoặc migration Java. Sửa trong Pitfall.
  - Phần blue-green / expand-contract còn lại đúng — không sửa.

Nghiệm thu:
- `node --check js/data/q-scenario.js` → OK (hết lỗi Unexpected identifier do backtick).
- `node scripts/validate.js`: **không còn lỗi/cảnh báo nào thuộc q-scenario.js**. 3 lỗi còn lại đều NGOÀI file sở hữu và có sẵn từ trước (không sửa theo luật 3 AGENTS.md):
  - `q-spring-data.js.bak`: file lạ không khai báo trong data-manifest.
  - `bugs.js`: lỗi cú pháp (backtick trong template literal ở dòng ~9204) — thuộc task khác.
  - `index-light.js`: cũ; không build lại được vì `bugs.js` lỗi khi nạp (`node scripts/build-light-index.js` fail).
- Không chạy test-lessons (đây là task q-scenario, không phải bài học).
