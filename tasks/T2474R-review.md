# T2474R — Fact-check nội dung mới của T2474

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2474 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kiến thức trong scenario-138, scenario-139, scenario-140, scenario-141. Đã kiểm tra:
- scenario-138: CPU busy-spin, top -H, jstack, hex conversion, BlockingQueue.poll(Duration) — đúng.
- scenario-139: Prometheus cardinality (150 × 1M = 150M series), Micrometer .tags() — đúng.
- scenario-140: CompletableFuture.orTimeout() + exceptionally() + join(), orTimeout không huỷ task — đúng.
- scenario-141: parallelStream() trên ForkJoinPool.commonPool(), thread starvation — đúng.
- Không có backtick, không có ${, không có markup lỗi.
- `node --check js/data/q-scenario.js` → OK.
- `node scripts/build-light-index.js` → OK.
- `node scripts/validate.js` → OK (lỗi ở file khác không phải quyền sở hữu).
