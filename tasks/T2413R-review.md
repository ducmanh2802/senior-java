# T2413R — Fact-check nội dung mới của T2413

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2413 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- sql-085: Senior tip gán `statement_timeout` / `idle_in_transaction_session_timeout` cho "cả hai" (Oracle + PostgreSQL) -> đã chỉnh rõ đây là thiết lập PostgreSQL, tránh hiểu nhầm áp dụng cho Oracle.
- sql-086, sql-087, sql-088, sql-089: không có lỗi kiến thức (MVCC/Ora-01555, SKIP LOCKED/NOWAIT, IDENTITY tắt batch Hibernate, isolation anomaly 40001, partition key trong PK, FK PG12+). Validator cảnh báo sql-087 đáp án dưới 1500 ký tự (warning, không lỗi) — giữ nguyên theo quy tắc task "không thêm nội dung".
- Chạy `node scripts/build-light-index.js` + `node scripts/validate.js` -> OK — không có lỗi.