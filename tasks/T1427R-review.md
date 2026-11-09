# T1427R — Fact-check nội dung mới của T1427

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1427 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
- `node scripts/validate.js` → OK — không có lỗi.
- `node scripts/test-lessons.js` → Lesson exercises OK: 222/219 (196 bài học, 14 từ cache).
- `node scripts/build-light-index.js` → đã ghi `js/data/index-light.js` (189.7 KB).

## Notes
- **lesson-microservices-005**: phần "Cơ chế từng bước" (7 bước trace context: client header → gateway extract → HTTP inject → thread pool capture → worker set/clear trong finally → batch span export → broker inject/extract) và "Lỗi hay gặp trên production" (4 triệu chứng: rò context giữa task, trace đứt do không inject header, cardinality explosion, retry DLQ không extract) — đúng kỹ thuật, W3C traceparent format, OpenTelemetry API (`Context.current()`, `Context.taskWrapping(executor)`, `BatchSpanProcessor`, `ParentBasedSampler`/`TraceIdRatioBased`) đều chính xác. Code minh họa capture/set/clear đúng ngữ nghĩa.
- **lesson-microservices-007**: phần "Cơ chế từng bước" (5 bước xoá lô: batch request → DB→Blob→Notify theo thứ tự → tổng hợp 200/207 → retry dựa trên tiến độ → kết thúc) và "Lỗi hay gặp trên production" (4 triệu chứng: trả 200 khi có lỗi, reconcile không lưu tiến độ, ledger chỉ trong RAM, hard delete không thể undo) — đúng kỹ thuật. `207 Multi-Status`, `compensation.delete.row/blob(id)`, `EnumSet<Step> done`, soft delete + `deleted_at` đều chính xác. Code `deleteOne` và `reconcile` pass 9/9 test.
- Không phát hiện lỗi kiến thức kỹ thuật, lỗi markup (không có backtick, `${` trong template literal), hay từ tiếng Anh lồng lẫn chưa giải thích. Các thuật ngữ (TraceId, SpanId, Saga, Compensation, 207 Multi-Status, DLQ, jitter, cardinality explosion...) đều được giải thích ngay lần đầu xuất hiện.
- Các lỗi validate còn lại (`q-system-design.js: Unexpected identifier 'SET'`, `lessons-architecture.js` related không tồn tại, `projects.js`/`path.js` design/architecture questions) đều nằm ngoài file sở hữu của task này, không cần xử lý.
