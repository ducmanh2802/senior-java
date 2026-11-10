# T713 — 2 bài DevOps mới

Status: DONE
Agent: qoder
Owns: `js/data/lessons-devops.js`

Track **devops** đã có 11 bài (đọc hết, không trùng). Thêm các bài dưới, order tiếp nối số lớn nhất, bài tập Java thuần chạy với Java 17 và tự chấm. Nếu một chủ đề đã có thì chọn chủ đề cùng track chưa có và ghi lý do vào Notes.
1. **Structured logging và correlation id**: log JSON, MDC truyền traceId qua thread pool (vì sao MDC mất khi sang thread khác), log level theo môi trường, không log PII. Bài tập: `MdcExecutor` bọc ExecutorService để copy context sang task và dọn sau khi chạy; ≥ 5 case.
2. **Phân tích log khi sự cố**: đếm lỗi theo cửa sổ thời gian, top endpoint lỗi, p95 latency từ access log — thứ dev phải làm khi chưa có dashboard. Bài tập: `AccessLogStats` parse dòng log định dạng cố định, tính error rate theo phút, p95 theo endpoint (nearest-rank); ≥ 6 case.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-devops.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

Đã thêm 2 bài vào cuối mảng `js/data/lessons-devops.js` (chèn trước `);`, không sửa bài cũ). Số id trước = 11, sau = 13 (`grep -c "id: '" js/data/lessons-devops.js` → 13).

- **`lesson-devops-012`** (order 12, senior, 40 phút) — Structured logging và correlation id: log NDJSON một dòng, vì sao ghi stdout thay vì file trong container, traceId/spanId + header `traceparent`, **MDC = ThreadLocal map** (giải thích tới gốc vì sao mất tích khi nhảy thread **và** kiểu hỏng thứ hai nguy hiểm hơn là rò rỉ traceId của request trước), `TaskDecorator` / Micrometer `ContextSnapshot` / OTel `Context.wrap`, bảng log level theo DEV/UAT/PROD + đổi level qua Actuator kèm TTL, PII chặn ở 4 lớp. Sơ đồ `~~~seq` 5 hệ thống cho đường đi traceId.
  - Bài tập `MdcExecutor`: `wrap`/`wrapCallable` chụp `LogContext.snapshot()` **lúc submit**, đặt vào thread chạy, khôi phục trong `finally`; `execute`/`submit` ủy quyền. 9 case, deterministic (single-thread pool + `future.get()`, không sleep). `LogContext` cung cấp sẵn trong starter/reference nên người học chỉ viết phần bọc context.
- **`lesson-devops-013`** (order 13, senior, 40 phút) — Phân tích access log khi chưa có dashboard: quy trình 5 bước (khoanh thời gian → khoanh phạm vi → tìm change → **giảm blast radius trước** → root cause), pipeline `awk | sort | uniq -c | sort -rn` cho lỗi theo phút và top endpoint, bẫy cardinality path mang id, 4xx ≠ 5xx, so **error rate** chứ không so số lỗi tuyệt đối, p95 **nearest-rank** + vì sao trung bình nói dối (bảng 2 tập mẫu), vì sao `rank = (95n+99)/100` bằng số nguyên thay `Math.ceil(0.95*n)` (0.95×20 = 19.000000000000004), PromQL đối chiếu khi đã có metric. Sơ đồ `~~~seq` đường đi một dòng log từ stdout tới Loki.
  - Bài tập `AccessLogStats`: `parse`, `statsByMinute` (TreeMap), `errorRate` theo phút, `p95` theo endpoint, `errorsByEndpoint`, `topErrorEndpoints` (tie-break A-Z). `LogLine`/`Bucket` cho sẵn. 12 case, không phụ thuộc thời gian thực — case chốt chặn đúng bug float (20 mẫu 10..200 → **190**, không phải 200).

Cả hai chủ đề đều chưa có trong track (đã đọc 11 bài cũ); không phải thay thế chủ đề nào.

Kết quả gate: `node scripts/test-lessons.js lesson-devops-012` → 9/9, `lesson-devops-013` → 12/12, `node scripts/test-lessons.js` (toàn bộ) → exit 0, `node scripts/build-light-index.js` → OK, `node scripts/validate.js` → **OK — không có lỗi** (chỉ còn cảnh báo cũ của `q-java.js`/`q-english.js` và cảnh báo PATH). Không commit.

**Đề xuất cho integrator** (tôi không sở hữu `js/data/path.js`): nối tiếp track devops hiện có bằng cách thêm `lesson-devops-012`, `lesson-devops-013` vào stage devops trong PATH — hết cảnh báo "có 35 bài học không nằm trong PATH". Đề xuất thứ tự 012 trước 013 (013 dùng khái niệm log JSON/traceId của 012), và đặt sau `lesson-devops-009` (Prometheus) vì 013 có mục đối chiếu PromQL.

Ghi chú thêm cho bài sau (không thuộc phạm vi T713): `lesson-devops-009` có body chứa đoạn văn lặp "Thêm nữa để đủ độ dài…" (~1,5k ký tự filler) để vượt mốc 2500 — nên viết lại body đó khi có task chỉnh sửa bài cũ.Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
Reviewed-by: kilo (T713R)
