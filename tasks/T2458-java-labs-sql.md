# T2458 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2422

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Keyset vs OFFSET**: API lịch sử lệnh dùng OFFSET 200000, EXPLAIN ANALYZE cho thấy đọc và bỏ 200k dòng; sửa bằng keyset pagination + index (account_id, created_at, id).

2. **Missing FK index on child table**: DELETE parent row chặn 1.200 INSERT/giây trên child table do thiếu index FK; sửa bằng CREATE INDEX CONCURRENTLY + FK NOT VALID + VALIDATE CONSTRAINT.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 lab mới:
- lab-sql-030: Keyset vs OFFSET pagination (OFFSET 200k đọc vứt 200k dòng, sửa bằng keyset pagination + index (account_id, created_at DESC, id))
- lab-sql-031: Missing FK index on child table (DELETE parent chặn 1.200 INSERT/giây do Seq Scan child table, sửa bằng CREATE INDEX CONCURRENTLY + FK NOT VALID + VALIDATE CONSTRAINT)

Cả 2 lab đều level senior, tuân thủ format AGENTS.md mục 10, có artifacts giả lập thực tế (EXPLAIN ANALYZE, pg_locks, app logs), hints ≥ 2, rubric ≥ 3, answer chi tiết ≥ 3000 ký tự với Tóm tắt, Nguyên nhân gốc, Dẫn chứng, Cách sửa, Phòng ngừa, Senior tip.

Lưu ý: `node scripts/build-light-index.js` thất bại do lỗi pre-existing trong q-ai.js (không thuộc file sở hữu). `node --check js/data/labs-sql.js` pass. `node scripts/validate.js` pass cho labs-sql.js (các lỗi hiển thị đều từ file khác).
Reviewed-by: kilo (T2458R)
