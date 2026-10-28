# T328 — Pet project chi tiết (phần 2): notifications, reconciliation, bff

Status: DONE
Agent: opencode
Owns: `js/data/projects.js`
After: T327

Làm đúng như `tasks/T327-projects-deep-a.md` (đọc kỹ cả 6 mục), áp dụng cho 3 dự án `proj-notifications`, `proj-reconciliation`, `proj-bff`. Không sửa 3 dự án T327 đã làm.

Trọng tâm riêng của từng dự án:
- **notifications:**
  - Fan-out đa kênh (email/SMS/push) qua Kafka; template và i18n.
  - Retry có backoff, DLQ, idempotency theo `notification_id`.
  - Rate limit theo kênh/nhà cung cấp; tôn trọng opt-out của người dùng.
  - Đo tỉ lệ giao thành công.
- **reconciliation:**
  - Batch đối soát file ngân hàng/đối tác (Spring Batch: chunk, restart, skip policy).
  - Matching theo khoá và dung sai; xử lý lệch tiền / lệch trạng thái / thiếu bản ghi.
  - Báo cáo chênh lệch, ghi audit; chạy lại idempotent.
  - Hiệu năng với khoảng 10 triệu dòng (partition, streaming, index).
- **bff:**
  - Gateway (Spring Cloud Gateway) + BFF gom nhiều service cho mobile.
  - Auth OAuth2/OIDC + token relay; timeout, circuit breaker, bulkhead (Resilience4j).
  - Cache và phân trang; versioning API.
  - Giảm số round-trip, đo p95 end-to-end; contract test.

Ghi file theo từng dự án, sau mỗi dự án chạy `node --check js/data/projects.js` và `node scripts/validate.js`. Ghi Notes, `Status: DONE`.

## Notes

- Rewrote proj-notifications, proj-reconciliation, proj-bff in js/data/projects.js (id/title/level/skills/readme unchanged; T327 projects and others untouched).
- Each: 8 user stories + acceptance, NFR numbers, out-of-scope; design 5.1k–6.1k chars (DDL + index rationale, API table + JSON, ASCII flow, error/concurrency table, tests, docker-compose, Micrometer metrics/alerts, x10 scaling); 5 milestones with numbered steps + commented code; 5 challenges; STAR with numbers + Demo trong 5 phút; 8 Q + answers (555–675 chars).
- related: only real ids (design-006/005/003, microservices-005/022/020/029/009/011/007/026/014, api-011/016/019, spring-016/020, db-039, sql-016, scenario-026, security-004, testing-004).
- node --check OK. validate.js OK on HEAD export + new projects.js; working tree currently fails only because another agent's in-progress q-microservices.js breaks parsing (microservices-* ids "not found").
Reviewed-by: claude (subagent; validate OK on HEAD+projects.js)
