# T2496R — Fact-check nội dung mới của T2496

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2496 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lab-incident-048 (edge gateway / OEE trùng dữ liệu / lệch giờ): không có lỗi kỹ thuật, giữ nguyên.
- lab-incident-049 (migration PostgreSQL ALTER TABLE): sửa 2 lỗi kiến thức + nhất quán dữ liệu:
  * Sai nhất quán: tình huống dùng `risk_correlation_id UUID NOT NULL DEFAULT gen_random_uuid()` (volatile → rewrite) nhưng artifact (flyway log, pg_locks, migration SQL) và đáp án lại ghi `risk_score SMALLINT NOT NULL DEFAULT 0` → chỉnh toàn bộ về `risk_correlation_id UUID NOT NULL DEFAULT gen_random_uuid()` (artifact, câu hỏi, gợi ý, đáp án, rubric, senior tip).
  * Sai kiến thức: cho rằng `NOT NULL DEFAULT 0` (hằng số) gây rewrite toàn bộ bảng trên PG 15. Đúng: PG 11+ metadata-only với DEFAULT hằng số kể cả có NOT NULL; rewrite gây do DEFAULT volatile (`gen_random_uuid()`) mỗi hàng cần giá trị riêng → sửa lại phần "Tại sao rewrite bảng", gợi ý 1, đáp án, rubric và senior tip cho đúng.
