# T2621R — Fact-check nội dung mới của T2621

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2621 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Đã review 2 bài học mới (lesson-db-020 write skew/SERIALIZABLE SSI, lesson-db-021 HOT update/fillfactor): nội dung kỹ thuật đúng (PG: 40001 serialization_failure, RR chặn lost update/phantom nhưng không chặn write skew, SSI dangerous structure, pg_advisory_xact_lock, fillfactor bảng 100/index 90, n_tup_hot_upd/n_tup_upd). Không sửa nội dung. node scripts/validate.js → OK. node scripts/test-lessons.js → 365/365 pass.
