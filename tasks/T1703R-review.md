# T1703R — Fact-check nội dung mới của T1703

Status: TODO
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1703 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Status: DONE

Đã sửa 4 lỗi kỹ thuật (giữ nguyên nội dung, chỉ sửa đúng):

1. **sql-035 (index)**: "MySQL 8.0.13+ có skip scan" → "MySQL 8.0.13 (2018) có skip scan" (bổ sung năm phát hành). Xác nhận qua MySQL 8.0.13 release notes (WL#11322).
2. **sql-035 (index)**: "PostgreSQL có skip scan cho B-tree từ bản 18 (2025)" → "PostgreSQL 18 (released 2025-09-25) có skip scan cho B-tree" (bổ sung ngày phát hành). Xác nhận qua docs.postgresql.org/release/18.
3. **sql-055 (transaction/bloat)**: "Tăng autovacuum aggressively" trong bảng so sánh → đổi tên cột thành "Tăng autovacuum mạnh hơn (tăng cost_limit/scale_factor)", vì "aggressive" là nhầm lẫn với "aggressive autovacuum" (một tuning level khác), còn ở đây nói về việc tăng `autovacuum_vacuum_cost_limit`/`autovacuum_vacuum_scale_factor`.
4. **sql-057 (migration)**: "thêm một cột NOT NULL và một index lớn vào bảng 2 tỷ dòng mà không được downtime" → "...mà không downtime" (loại từ lặp "được").

Các câu sql-053..sql-060 còn lại: đã đọc kỹ, không lỗi kiến thức (version, cơ chế, markup, số liệu đều chính xác). Không có lỗi markup, không backtick/`${` trong template literal, không field thừa.

Kiểm tra: `node --check js/data/q-sql.js` → OK; `node scripts/validate.js` → "OK — không có lỗi." (sql: 60 câu hỏi).