# T2416R — Fact-check nội dung mới của T2416

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2416 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 5 câu mới (devops-185…189) trong `js/data/q-devops.js`. Không sửa văn phong/độ dài, không thêm/xoá mục, không sửa nội dung cũ ở HEAD.

Lỗi kỹ thuật đã sửa:

- **devops-185** (code Java): đoạn code trộn hai thư viện không tương thích — `propagators.getTextMapPropagator()` là API Micrometer Tracing, nhưng `inject(Context.current(), request, setter)` lại dùng `TextMapSetter`/`io.opentelemetry.context.Context` của OpenTelemetry, và `extract(...)` của Micrometer trả `Span.Builder` chứ không trả `Context` (Micrometer `Propagator.inject` nhận `TraceContext` + `Setter` riêng). Đoạn này không biên dịch được. Đã viết lại theo **API OpenTelemetry**: `otel.getPropagators().getTextMapPropagator()` với bean `OpenTelemetry` của Spring Boot, `Context.current()`, `TextMapSetter`, `TextMapGetter`, `Scope` (try-with-resources); ghi chú rõ `kafkaGetter` bọc `record.headers()`. Phần còn lại của 185 đã đúng: W3C là mặc định của Spring Boot/Micrometer Tracing, `0,1^5 = 0,001%`, head sampling vs tail sampling, span link cho batch, orphan span ratio.
- **devops-186**: tên metric sai `executor_queued_tasks` → `executor_queued` (Micrometer `ExecutorServiceMetrics` chỉ có `executor.active/queued/completed/pool.*`, không có hậu tố `_tasks`). SLO cấu hình sai tên meter `hikaricp.acquire` → `hikaricp.connections.acquire` (đúng tên meter HikariCP). Mô tả `node_disk_io_time_seconds_total` là "iowait" là sai bản chất (iowait là `node_cpu_seconds_total{mode="iowait"}`) → sửa thành "thời gian thiết bị bận I/O". Các phần còn lại đúng: RED/USE, `histogram_quantile` gộp bucket, p99 không trung bình được (9×200ms + 1×5s = 680ms), `percentiles-histogram`/`slo` property.
- **devops-189**: số liệu không nhất quán — "lỗi 38%, kéo dài 26 phút, tiêu 43% error budget tháng" là vô căn cứ (99,9%/30 ngày = 43,2 phút budget; 38% trong 26 phút ≈ 23%, và thực tế lỗi giảm còn 6% sau 8 phút nên chỉ ≈ 10%). Đã ghi rõ SLO 99,9% và sửa thành "khoảng 10%" kèm diễn biến 38% → 6% → 0,1%. "Comms cập nhật 4 lần trong 26 phút" mâu thuẫn với nhịp 15–30 phút đã nêu → sửa còn 2 lần.

Không có lỗi kiến thức ở **devops-187** (180 = 30×6, precision 8/46 = 17%, 4×3+12 = 24 rule, burn rate 14,4×/1h kèm cửa sổ 5 phút, cú pháp grouping/inhibit của Alertmanager, `promtool`) và **devops-188** (MDC, `OncePerRequestFilter`, `TaskDecorator`, MDC clear trong finally, log injection/PII) — giữ nguyên.

Nghiệm thu: `node --check js/data/q-devops.js` OK; `node scripts/validate.js` → **OK — không có lỗi.** (giữa lúc chạy, `labs-incident.js` của task khác đang dở dang bị lỗi cú pháp backtick làm validate tạm đỏ; đã tự hết khi agent kia sửa xong — lần chạy cuối OK, không phải lỗi của file này). Không commit.
