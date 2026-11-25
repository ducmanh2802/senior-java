# T2687R — Fact-check nội dung mới của T2687

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2687 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 3 câu mới (microservices-129/130/131). 129 (BFF mobile vs web) và 130 (service mesh cost) đúng kỹ thuật, không sửa.

Lỗi đã sửa (tất cả trong microservices-131 — phần OpenTelemetry/Micrometer/exemplars):
- **Config YAML bịa thuộc tính**: `management.otel.traces.exporter`, `management.otel.metrics.export.exemplar.sampling.trace_id_based` không tồn tại trong Spring Boot 3.2. Thay bằng thuộc tính thật: `management.otlp.tracing.endpoint` (OTLP/HTTP), `management.tracing.exemplars.include: sampled-traces` (mặc định), và `management.metrics.distribution.percentiles-histogram.http.server.requests: true` (bắt buộc bật histogram mới có chỗ gắn exemplar). (đã đối chiếu docs.spring.io + blog Spring 2025).
- **Bean `MeterFilter` dùng API không tồn tại**: `metric.getType().isHistogramOrTimer()` và `MeterFilter.replaceTags((id, tags) -> tags)` (overload 2 tham số không có thật). Exemplar do Spring Boot tự đăng ký `SpanContext` khi có Micrometer Tracing, không cần MeterFilter. Đã bỏ bean sai, thay bằng ghi chú đúng.
- **Cơ chế nói sai (bước 7)**: "Micrometer MeterFilter gắn traceId vào exemplars của Timer/Counter/DistributionSummary" — sai, Counter không gắn exemplar (chỉ histogram/timer) và cơ chế là SpanContext tự động. Đã sửa.
- **Gán nhầm phiên bản**: "Exemplars (OpenTelemetry 1.30+)" — exemplar là tính năng Micrometer + Prometheus/OTLP, không phải OTel 1.30+. Đã sửa.
- **Pitfall + trả lời mẫu + follow** còn nhắc `trace_id_based` sampling (không có thật): đã đổi sang `percentiles-histogram` / `management.tracing.exemplars.include` (sampled-traces vs all).

Nghiệm thu: `node --check js/data/q-microservices.js` → OK. `node scripts/validate.js` không báo lỗi nào cho q-microservices.js.

LƯU Ý (không thuộc quyền sở hữu, không tự sửa): validate còn nhiều lỗi từ file agent khác — `q-devops.js` lỗi cú pháp (Unexpected identifier 'tắt' dòng ~18448), `labs-sql.js` lỗi token, `lessons-jpa/jvm/devops` (body/related), `path.js`/`projects.js` tham chiếu id devops không tồn tại. `index-light.js` bị báo cũ là hệ quả: `scripts/build-light-index.js` dừng ngay vì `q-devops.js` không parse được, nên không sinh lại được index. Cần agent sở hữu các file trên sửa trước; khi đó chạy lại `node scripts/build-light-index.js` rồi `node scripts/validate.js` sẽ OK.
