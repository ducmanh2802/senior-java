# T2554R — Fact-check nội dung mới của T2554

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2554 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 câu hỏi mới (sql-107, sql-108, sql-109):

**sql-107** (Oracle vs PostgreSQL vs MSSQL):
- Sửa mô tả Oracle `seq.CURRVAL`: Oracle CÓ hàm lấy giá trị vừa sinh trong session (`seq.CURRVAL` sau khi gọi `NEXTVAL`), không phải "không có hàm".
- Sửa ví dụ MSSQL MERGE: bỏ `FROM dual` (Oracle-specific), thay bằng `USING (VALUES (1, 100)) s(id, amt)` chuẩn MSSQL.

**sql-108** (Window function cho nhà máy 3 ca/ngày):
- Sửa 불일치 lớn: câu hỏi hỏi "trung bình 7 ngày" nhưng code dùng `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` = 7 ca (shifts). Đã sửa câu hỏi, tóm tắt, ví dụ đời thực, trả lời phỏng vấn, follow-up thành "7 ca gần nhất / rolling 7 shifts" cho nhất quán.
- Sửa `NTILE(4)` → `NTILE(3)` vì mỗi ngày chỉ có 3 ca, chia 4 tứ phân vị không hợp lý; đổi tên section thành "phân chia ba nhóm hiệu suất theo ngày".

**sql-109** (Recursive CTE traceability lot):
- Sửa sai sót: "Recursive CTE không dùng được trong VIEW (PG cho phép...)" → PostgreSQL HỖ TRỢ recursive CTE trong VIEW từ phiên bản 9.3+. Đã sửa thành "Recursive CTE trong VIEW: PostgreSQL cho phép (từ 9.3+), nhưng một số DB khác không hỗ trợ -> kiểm tra tài liệu DB đích."

Pre-existing errors in other files (bugs.js syntax, q-spring-data.js.bak, index-light.js outdated) không liên quan đến task này.
