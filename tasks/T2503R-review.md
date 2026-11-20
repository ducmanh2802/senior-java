# T2503R — Fact-check nội dung mới của T2503

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2503 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Ba câu hỏi mới (scenario-172, 173, 174) đều đúng kỹ thuật:
- scenario-172: Quy trình chẩn đoán N+1 từ DevTools → OpenTelemetry trace → EXPLAIN ANALYZE BUFFERS chính xác; giải pháp tách hai bước id+IN, index composite, keyset pagination, bỏ count(*) đều đúng; plan EXPLAIN thực tế khớp với N+1.
- scenario-173: Phân tách đúng hai sự cố (cache bundle SPA + API versioning mobile); Cache-Control header cho index.html (no-store) và asset hash (immutable) đúng; chiến lược giữ asset cũ, atomic deploy, router.onError retry chunk hợp lý; API versioning additive/URL/header/expand-contract/feature flag đúng; xử lý enum UNKNOWN, LocalDateTime vs Instant, CORS preflight đúng.
- scenario-174: Schema CRUD có version (optimistic locking), soft delete, partial unique index, timestamptz, JSONB audit đúng PostgreSQL 15; API dùng ETag/If-Match, Idempotency-Key, problem+json (RFC 9457) đúng; Spring Security 6 SecurityFilterChain + @EnableMethodSecurity, tránh @PostFilter sau phân trang, đề xuất RLS đúng; audit ghi cùng transaction, actor truyền tường minh tránh @Async leak SecurityContext đúng; so sánh 4 cơ chế audit (app/Envers/CDC/trigger) đúng ưu/nhược; Testcontainers + Flyway + IDOR + optimistic conflict test đúng.
Validator không báo lỗi cho ba id này. Syntax check pass.
