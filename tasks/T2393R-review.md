# T2393R — Fact-check nội dung mới của T2393

Status: DONE
Agent: opencode
Owns: `js/data/lessons-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2393 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Kiểm tra qua `git diff HEAD -- js/data/lessons-devops.js`: thêm bài `lesson-devops-022` về Kubernetes probes (liveness/readiness/startup), graceful shutdown và probe server.
- `node scripts/validate.js` → OK — không có lỗi schema/Markup.
- `node scripts/test-lessons.js` → 327/327 bài tập pass.
- Không có lỗi kỹ thuật, markup hoặc số liệu sai. Nội dung mới tuân thủ đúng AGENTS.md schema, đúng Java 17/21, Spring Boot 3.x.
- Ghi: không có lỗi.
