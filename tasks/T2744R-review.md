# T2744R — Fact-check nội dung mới của T2744

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2744 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed new nội dung T2744 trong `js/data/labs-sql.js`: `lab-sql-052` (PreparedStatement generic plan / parameter skew, PostgreSQL 15) và `lab-sql-053` (LIKE wildcard đầu không dùng B-tree, pg_trgm / cột đảo ngược).

Không tìm thấy lỗi kiến thức cần sửa:
- lab-sql-052: plan_cache_mode = auto (custom plan 5 EXECUTE đầu rồi generic, PG 12+), force_custom_plan/force_generic_plan, SET/ALTER DATABASE/ALTER ROLE, generic plan dùng avg selectivity từ pg_stats (60M/4 = 15M est), số liệu nhất quán (PENDING 0,5%=300k, DELIVERED 85%=51M, SHIPPED 10%=6M, CANCELLED 4,5%=2,7M), Index Scan xấu cho 85% qua random I/O vs Seq Scan — đều đúng.
- lab-sql-053: B-tree chỉ tiền tố, leading % → Seq Scan, pg_trgm GiN/GiST (gin_trgm_ops), reverse(email) btree + LIKE 'moc.liamg@%', CREATE INDEX CONCURRENTLY — đều đúng.

Markup: không backtick, không `${`, đủ các mục bắt buộc (Tóm tắt, Nguyên nhân gốc, Dẫn chứng, Cách sửa, Phòng ngừa, Trả lời mẫu, Senior tip), 3 câu hỏi, 3 gợi ý, 5 rubric, 2 artifact (>200 ký tự).

`node --check js/data/labs-sql.js` → OK. `node scripts/validate.js` → không báo lỗi nào labs-sql.js (các LỖI còn lại trong q-soft.js, quiz-ops.js, labs-gc.js, lessons-*.js, projects.js, path.js là nội dung cũ của file khác, không sở hữu, không đụng). index-light.js cũ là cảnh báo từ dữ liệu khác, lab không ảnh hưởng đến index-light nên không chạy build-light-index (theo AGENTS.md mục 2.6, labs không trong danh sách).
