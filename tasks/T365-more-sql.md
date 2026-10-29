# T365 — SQL: thêm 8 câu nền tảng

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`

Thêm **8 câu** topic sql, ưu tiên level **mid** (khoảng 60% mid, 30% senior, 10% lead), phong cách câu hỏi phỏng vấn thật ("Bạn sẽ… thế nào?", "So sánh… khi nào chọn cái nào?"). Gợi ý chủ đề (kiểm tra trùng trước, thay bằng chủ đề tương đương nếu đã có):
- JOIN các loại bằng ví dụ dữ liệu cụ thể
- GROUP BY, HAVING và bẫy với NULL
- Subquery vs JOIN vs EXISTS
- Transaction và ACID bằng ví dụ chuyển tiền
- UNIQUE constraint, foreign key và vì sao nên để DB đảm bảo
- Kiểu dữ liệu: DECIMAL cho tiền, timestamp with time zone
- UPSERT (INSERT ... ON CONFLICT / ON DUPLICATE KEY)
- CTE và recursive CTE cho cây danh mục

### Chuẩn chung (bắt buộc)
- Đọc AGENTS.md mục 2, 4, 5, 6, 13 trước khi viết. Người học là dev Java ~4 năm, **hổng nền tảng**: giải thích từ gốc, ví dụ đời thường, cơ chế từng bước có "vì sao", sơ đồ ASCII hoặc số liệu, code ngắn có comment, bảng trade-off, ### Lỗi hay gặp, ### Trả lời miệng 1 phút ngay trước > Senior tip:.
- Chống trùng: đọc hết câu cùng topic trong file của bạn và grep các file js/data/q-*.js khác; chủ đề đã có thì chọn góc khác hoặc bỏ.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6, Kubernetes/AWS hiện hành. Không chắc thì viết ít lại nhưng đúng. refs chỉ dùng link chắc chắn tồn tại; chạy node scripts/check-links.mjs <tên-file.js> (chỉ tên file) và bỏ link hỏng.
- Chỉ **thêm**, id tiếp số lớn nhất của topic/category trong file. Không sửa nội dung đã có.
- Trong template literal: không có ký tự backtick, không có ${ chưa escape, dấu \ phải viết \\; inline code dùng {{code}}.
- **Không bao giờ để file hỏng cú pháp**: sau mỗi lần sửa chạy node --check <file>; nếu hỏng mà không sửa được thì khôi phục bằng git checkout -- <file> rồi làm lại từng mục một.
- Không chạy trực tiếp file .js như lệnh (luôn node <file>). Không commit/push, không kill tiến trình, không mở trình duyệt.
- Xong: node scripts/validate.js → OK — không có lỗi.; ghi Notes (id đã thêm) và đổi dòng trạng thái thành đúng Status: DONE (chỉ dùng TODO hoặc DONE, không dùng giá trị khác).

## Notes
- Thêm sql-023..030 (5 mid, 2 senior, 1 lead): 023 JOIN các loại + fan-out khi SUM; 024 constraint (UNIQUE/FK/CHECK) vs check-then-insert; 025 NUMERIC cho tiền, timestamptz/DATETIME + kiểu Java; 026 transaction thực tế (autocommit, aborted transaction PG vs MySQL, SAVEPOINT, transaction dài); 027 UNION/UNION ALL/INTERSECT/EXCEPT; 028 UPDATE FROM/JOIN, DELETE USING, chia lô an toàn; 029 số hoá đơn không lỗ hổng (counter table); 030 bảng giá có hiệu lực, as-of query, exclusion constraint.
- Bỏ các gợi ý đã có: GROUP BY/HAVING (sql-004), EXISTS (sql-003), recursive CTE (sql-009), UPSERT (sql-010), ACID chuyển tiền (q-spring-data db).

Reviewed-by: claude (subagent; validate OK)
