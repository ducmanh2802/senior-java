# T2824R — Fact-check nội dung mới của T2824

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2824 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 3 câu hỏi mới (architecture-084, architecture-085, architecture-086):
- architecture-084: Database per service, shared DB, strangler fig — đúng kỹ thuật (PostgreSQL cross-db FK, 3 pattern thay FK, API composition/CQRS, Micrometer metric).
- architecture-085: ADR, fitness function, ArchUnit — đúng kỹ thuật (evolutionary architecture, ArchUnit, Spring Cloud Contract/Pact, Micrometer+Prometheus SLO, supersede flow).
- architecture-086: Strangler fig migration order (churn, coupling, blast radius, business value) — đúng kỹ thuật (git log churn, ArchUnit/jdeps coupling, distributed tracing cho blast radius, heuristic formula).
- Validate: không lỗi cho 3 câu hỏi này. Các lỗi validate hiện tại thuộc file khác (labs-gc.js, q-frontend.js, quiz-ops.js, lessons-*.js) không trong sở hữu task này.
- Không có lỗi kiến thức cần sửa. Ghi nhận "không có lỗi".
