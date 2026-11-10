# T1417R — Fact-check nội dung mới của T1417

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1417 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

không có lỗi kiến thức — nội dung thêm vào lesson-db-003 (B-tree lookup, so sánh red-black, 4 production pitfall: low-cardinality index, thiếu ANALYZE, write amplification, index-only scan) và lesson-db-004 (vòng đời connection pool, bảng so sánh 4 timeout, 4 pitfall: transaction rộng, thiếu statement_timeout, leak, tăng pool mù) đều đúng kỹ thuật với PostgreSQL 15, HikariCP, Java 17/21. Markup hợp lệ, không backtick, không `${` trong template literal. 4 câu check mới ở mỗi bài đều đúng đáp án và giải thích chính xác.
