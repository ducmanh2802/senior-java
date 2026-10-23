# T110R — Fact-check nội dung mới của T110

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`, `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T110 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lab-incident-006`–`008`: fact-check Little's law, `max.poll.interval.ms`/heartbeat semantics, and ThreadLocal cleanup; no technical errors found.
- `lab-incident-009`: clarified that each layer allows at most 3 attempts including the initial call; updated artifact, hints, and answer so 27 is the worst case and observed metrics need not reach it.
- `lab-sql-006`–`008`: fact-check cast/index expressions and IMMUTABLE requirement, deadlock SQLSTATE/retrying the full transaction, and vacuum horizons (`xmin`/`catalog_xmin`) separately from WAL retention (`restart_lsn`); no technical errors found.
