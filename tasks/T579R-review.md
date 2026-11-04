# T579R — Fact-check nội dung mới của T579

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T579 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- collections-027: làm rõ cơ chế HashMap mất entry khi key mutable (hashCode tại put vs get), thêm giải pháp remove trước khi sửa, nhấn mạnh chỉ dùng immutable key.
- collections-028: sửa so sánh đầy đủ HashMap/ConcurrentHashMap/LinkedHashMap/Caffeine (thread-safety, eviction, footprint), thêm cảnh báo dùng pool chung, khuyến nghị Caffeine cho production.
- modern-025: làm rõ sealed+record+exhaustive switch vs enum/visitor, khi nào chọn switch vs Visitor.
- modern-026: phân tích chi tiết record vs JPA entity (no-arg constructor, dirty tracking, proxy/final, lazy loading), khuyến nghị đúng vai trò.
- modern-027: làm rõ ForkJoinPool.commonPool, blocking I/O nguy hiểm, side effect, overhead với dataset nhỏ, khuyến nghị CompletableFuture/custom pool.

Sửa kỹ thuật, markup, chính xác theo Java 17/21. validate: OK.
