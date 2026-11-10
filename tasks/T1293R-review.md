# T1293R — Fact-check nội dung mới của T1293

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1293 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check 6 section "### Ví dụ đời thực" mới của T1293 (xem `git diff HEAD -- js/data/q-sql.js`, 18 dòng thêm) ở sql-019, sql-020, sql-021, sql-022, sql-023, sql-024:
- sql-019 (app_session, khoảng chồng): kỹ thuật đúng (island marker MAX(end_ts) frame 1 PRECEDING, chuẩn hoá end_ts NULL, index (user_id, start_ts, end_ts)). Sửa "CPU spike" → "CPU tăng cao đột ngột" (chữ nước ngoài trong prose).
- sql-020 (GROUPING SETS POS): đúng cú pháp, số liệu nhất quán.
- sql-021 (CTE MATERIALIZED, PG 11→13): đúng quy tắc inline/fence/MATERIALIZED.
- sql-022 (parallel query, oversubscription): đúng (parallel_setup_cost mặc định 1000, ALTER ROLE…SET).
- sql-023 (JOIN fan-out, FULL OUTER JOIN): đúng (gộp trước join sau, IS DISTINCT FROM).
- sql-024 (UNIQUE lower(email), FK NOT VALID+VALIDATE, SQLSTATE 23505/23503): đúng.
Không tìm thấy lỗi markup (không backtick, không ${), không sai API/mặc định/cơ chế.
node --check js/data/q-sql.js: OK. node scripts/build-light-index.js: OK (ghi index-light.js). node scripts/validate.js: không báo lỗi q-sql.js; validate.js vẫn exit 1 do lỗi cũ trong lessons-testing.js (file không sở hữu bởi T1293R, không sửa theo quy tắc 3).
