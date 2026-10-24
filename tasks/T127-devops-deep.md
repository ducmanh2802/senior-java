# T127 — DevOps/K8s cho Java dev

Status: DONE
Agent: agy
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn trong mọi file q-*.js (không trùng). Thêm **~8 câu** topic `devops` (id tiếp nối số lớn nhất hiện có, ~2 mid / 4 senior / 2 lead, đáp án 2500–4000 ký tự, kết bằng `> Senior tip:`): container hoá JVM (MaxRAMPercentage, CPU limit và GC thread, ảnh layered của Spring Boot), liveness vs readiness vs startup probe với Actuator, graceful shutdown (server.shutdown=graceful, preStop), HPA theo CPU vs custom metric, rolling vs blue-green vs canary, CI/CD pipeline và rollback DB migration (Flyway expand-contract), observability (Micrometer, OpenTelemetry trace, log tương quan). Chỉ dùng API/hành vi bạn chắc chắn đúng (Java 17/21, Spring Boot 3.x, PostgreSQL 16). Không thêm `refs` nếu không chắc link tồn tại. Chạy `node scripts/validate.js` → OK, rồi ghi `Status: DONE` + ghi chú ngắn.

## Notes
- Đã thêm `devops-015..022` (2 mid / 4 senior / 2 lead), nối tiếp 14 câu có sẵn: JVM trong container (CPU limit, CFS throttling, GC thread, MaxRAMPercentage), liveness/readiness/startup probe với Actuator, graceful shutdown và drain Kafka/executor, HPA với custom metric/KEDA, rolling vs blue-green vs canary, CI/CD build-once/promote, Flyway expand-contract và rollback DB, observability Micrometer/OpenTelemetry. Đáp án 3.954–3.998 ký tự, kết bằng `> Senior tip:`.
- `node --check js/data/q-devops.js` và `node scripts/validate.js` → `OK — không có lỗi.` (584 câu hỏi). Không sửa file nào khác ngoài `js/data/q-devops.js` và task này.
Reviewed-by: opencode (T127R)
