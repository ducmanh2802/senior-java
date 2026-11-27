# T2751R — Fact-check nội dung mới của T2751

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2751 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

### sql-122 (Window Functions)
- **LAG(12) cho YoY trên dữ liệu ngày**: Sửa từ `LAG(revenue, 12)` (sai — 12 dòng trước = 12 ngày trước) thành giải thích đúng: YoY trên daily data cần `LAG 365/366` hoặc aggregate lên tháng rồi `LAG 1/12`. Thêm CTE `with_lag` để tránh lặp LAG nhiều lần trong SELECT.
- **NTILE trong WHERE clause**: Ví dụ cũ vi phạm quy tắc (window function không được ở WHERE). Đã sửa: dùng CTE `with_decile` wrap NTILE, filter `WHERE decile = 1` ở outer query.
- Thêm lỗi hay gặp: "LAG 12 trên dữ liệu ngày cho YoY — sai".

### sql-123 (Keyset Pagination)
- **NULL handling**: Xoá condition `AND amount IS NOT DISTINCT FROM :amount` không hợp lý trong row constructor comparison. Chỉ giữ `WHERE (COALESCE(amount, -1), ...) < ...` khớp sentinel logic.
- **COUNT(*) OVER() performance**: Làm rõ cost là "quét tất cả dòng khớp WHERE" chứ không chỉ 51 dòng, phù hợp khi filter chọn lọc.

### sql-124 (Sub-partitioning)
- **pg_partman params**: Sửa `p_subpartition := 'hash'` thành `p_subpartition_type := 'hash'` (tên param đúng).
- **Partial index với CURRENT_DATE**: Sửa — PostgreSQL không cho phép volatile function trong index predicate. Đổi thành fixed date `'2026-01-01'` kèm ghi chú cần recreate định kỳ.
- **Số sub-partition**: Sửa "192 sub-partition/tháng" thành "16 sub-partition/tháng (192 cho 12 tháng)".
- **PG version**: Sửa "PG 17" thành "PG 15/16" (phiên bản hiện tại).
- **Ví dụ đời thực**: Sửa "5 tỷ events/tháng" thành "5 tỷ events (tổng)" cho nhất quán.
- **PK BIGSERIAL**: Làm rõ sequence global cho giá trị unique, nhưng PK constraint chỉ enforce trong mỗi sub-partition.

Tất cả sửa lỗi kỹ thuật; không thay đổi văn phong/độ dài/bố cục. `node scripts/validate.js` → OK (lỗi còn lại là pre-existing ở file khác).
