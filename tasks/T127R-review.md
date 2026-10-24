# T127R — Fact-check nội dung mới của T127

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T127 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review 8 câu hỏi mới (devops-015…022) trong `js/data/q-devops.js`. Đã kiểm soát chéo các mốc thực tế bằng nguồn chính thức (OpenJDK/IBM docs cho cờ JVM, Flyway/Redgate docs, PostgreSQL docs, Kubernetes/HPA docs, Spring Boot docs). Nội dung HEAD cũ không đổi.

Lỗi đã sửa theo id:
- devops-015: (a) tuyên bố sai "đặt -Xmx song song MaxRAMPercentage thì cờ sau ghi đè cờ trước tuỳ thứ tự" — thực tế nếu `-Xmx` được đặt tường minh thì JVM lập tức bỏ qua `MaxRAMPercentage` bất kể thứ tự (nguồn: IBM docs, JDK-8369346). Viết lại thành khuyến nghị chọn một trong hai.
- devops-020: đổi image Testcontainers `postgres:16-alpine` → `postgres:15-alpine` cho khớp chuẩn PostgreSQL 15 của repo (media review chỉ sửa file mình sở hữu; q-soft.js và quiz.js vẫn dùng postgres:16 — không thuộc quyền, không đụng).
- devops-021: (a) tuyên bố sai "Flyway mặc định bọc migration trong transaction, phải ép `executeInTransaction`" — thực tế Flyway tự nhận diện `CREATE INDEX CONCURRENTLY` (PostgreSQLParser, từ Flyway 4.1) và tự chạy migration đó ngoài transaction; giữ lại `executeInTransaction=false` chỉ như biện pháp cho phiên bản cũ, bổ sung thêm chi tiết đúng: mặc định advisory lock kiểu transactional của Flyway trên PostgreSQL dễ treo quanh loại lệnh này → `flyway.postgresql.transactional.lock=false` (nguồn: Flyway/Redgate docs, flyway#3854). (b) heading "### Bốn pha expand-contract" nhưng bảng có 5 pha → sửa thành "Năm pha".
- devops-017: timeline tắt Pod ghi "t=40 hết timeout-per-shutdown-phase" nhưng block cấu hình mẫu chỉ đặt 20 s → sửa thành t=30 "(20 s)" cho tự nhất quán.

Các điểm đã kiểm và giữ nguyên (đúng thực tế): cgroup cpu.max 200000/100000 → 2 CPU; UseContainerSupport mặc định từ JDK 10; cgroup v2 đọc được từ JDK 15 (11.0.16+/8u372+ backport); G1 mặc định cần ≥ 2 CPU và ≥ 1792 MB, dưới ngưỡng → SerialGC; CFS quota 100 ms; `-XX:+PrintFlagsFinal`, `-XshowSettings:system`, `jcmd GC.heap_info` đều là cờ/lệnh thật; Actuator health group + readinessState/livenessState và các giá trị ACCEPTING_TRAFFIC/REFUSING_TRAFFIC; Boot không có Kafka indicator mặc định; Boot 3.4 đặt graceful shutdown làm mặc định; `spring.lifecycle.timeout-per-shutdown-phase` mặc định 30s; thuộc tính `spring.task.execution.shutdown.await-termination*`; preStop `httpGet` (K8s 1.28+); pipeline HPA `desired = ceil(replicas × value / target)`, sync 15s, sự kiện `FailedGetExternalMetric`; KEDA tạo HPA bên dưới và scale-to-zero; Flyway checksum/validate, `cleanDisabled`, undo chỉ có ở Teams; PG ≥ 11 ADD COLUMN default tĩnh nhanh, `CHECK ... NOT VALID` + `VALIDATE CONSTRAINT`; artifact names `micrometer-registry-prometheus`, `micrometer-tracing-bridge-otel`, `opentelemetry-exporter-otlp`; thuộc tính `management.metrics.distribution.percentiles-histogram.*`; metric Prometheus `http_server_requests_seconds_count`.

Không có lỗi markup/backtick/`${`, không chữ nước ngoài lạc đề. `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo duy nhất ở q-english.js english-055…063, tồn tại từ trước, không thuộc task này).

