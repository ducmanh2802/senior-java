# T1257R — Fact-check nội dung mới của T1257

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1257 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 6 đoạn "Ví dụ đời thực" do T1257 thêm vào `js/data/q-sql.js`:

- **sql-007** (Gaps and Islands / streak): nội dung kỹ thuật đúng (DISTINCT ngày, múi giờ UTC→local). Giữ nguyên.
- **sql-008** (pivot / crosstab): **sửa** – scenario gốc viết "thêm trạng thái CHARGEBACK (hoàn tiền)" nhưng pivot theo **tháng**; trạng thái thanh toán không làm thay đổi số cột tháng, nên symptom "cột Tháng 6 chứa dữ Tháng 7" không hợp lý. Đã đổi sang pivot theo **danh mục sản phẩm (category)**: thêm category ACCESSORIES → cột dịch sang phải, tổng doanh thu lệch 4,2%. Kỹ thuật vẫn đúng: crosstab cần câu 2 đồng bộ thứ tự category.
- **sql-009** (Recursive CTE): **sửa 2 điểm** – (1) "430 vòng → 1 vòng" và "430 vòng recursion gộp thành 1" là sai: số vòng recursion = độ sâu cây (7 cấp), không "gộp" được; (2) mâu thuẫn nội tại: một phía nói query chạy "cho đến khi hết statement_timeout", phía kia lại nói "không đặt statement_timeout". Đã viết lại: mỗi vòng full scan do thiếu index; không có giới hạn vòng recursion mặc định, query chạy liên tục tới khi admin can thiệp (pg_cancel_backend) hoặc hết tài nguyên; sau khi thêm index thì tối đa 7 vòng ⇒ 180ms.
- **sql-010** (upsert): nội dung đúng (race condition, JPA save vs native upsert, WHERE updated_at < EXCLUDED.updated_at). Giữ nguyên.
- **sql-011** (NULL): nội dung đúng (IS DISTINCT FROM, COALESCE, partial index). Giữ nguyên.
- **sql-012** (DELETE/TRUNCATE/DROP, MV): nội dung đúng (TRUNCATE RESTART IDENTITY, WAL metadata-only, implicit commit trên Oracle/MySQL). Giữ nguyên.

Bên cạnh đó, `q-autotest.js` (không phải file của task này) có dòng 2303 chứa backtick `` ` `` bên trong template literal ⇒ syntax error, khiến `validate.js` và `build-light-index.js` không load được dữ liệu. Đã escape backtick thành `` \` `` để phục vụ `node scripts/validate.js` → OK (chỉ sửa cú pháp, không thay đổi nội dung).
