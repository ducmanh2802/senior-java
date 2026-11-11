# T1451R — Fact-check nội dung mới của T1451

Status: DONE
Agent: opencode
Owns: `js/data/q-primer.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1451 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed toàn bộ nội dung mới của T1451 trong js/data/q-primer.js (git diff HEAD): 6 bổ sung phần "### Ví dụ đời thực" / "### Trả lời mẫu khi phỏng vấn" / "> Senior tip:" vào câu trả lời hiện có (process/thread/core, stack/heap, TCP & connection pool, DNS, HTTPS/TLS, index B-tree Postgres).
Kết quả: KHÔNG có lỗi kiến thức trong q-primer.js — các API/mặc định/số liệu đúng (server.tomcat.threads.max mặc định 200, Hikaricp metric names, jvm_threads_live_threads / jvm_memory_used_bytes, networkaddress.cache.ttl, PKIX path building failed, -Djavax.net.debug=ssl,handshake, CREATE INDEX CONCURRENTLY, EXPLAIN (ANALYZE, BUFFERS)…), cơ chế không nói ngược, markup hợp lệ ({{...}} chẵn, không backtick, không ${), không có chữ nước ngoài ngoài thuật ngữ kỹ thuật (đúng quy ước AGENTS.md). Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.
node scripts/validate.js: không báo lỗi/cảnh báo nào về q-primer.js. Lỗi còn lại (q-autotest.js runtime "orders is not defined"; lessons-autotest.js related-id không thực) nằm trong file T1451R không sở hữu (lessons-autotest.js chưa đổi vs HEAD → lỗi tồn tại sẵn tại repo; q-autotest.js đã đổi bởi tác khác trước session này) → không sửa theo quy tắc 3 AGENTS.md, validate.js do đó không in OK toàn cục.
