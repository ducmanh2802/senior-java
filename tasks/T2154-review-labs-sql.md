# T2154 — Rà soát chất lượng 4 lab mới nhất trong labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2102

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học (dev Java ~4 năm, hổng nền tảng) dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 lab mới nhất trong `js/data/labs-sql.js` (grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: artifact giống thật và tự nhất quán (định dạng jstack/GC log JDK 17+/EXPLAIN PostgreSQL đúng, timestamp, lock id, số liệu khớp nhau và khớp answer); answer trích đúng dòng trong artifact; cách sửa đúng kỹ thuật; rubric ≥ 3 ý đo được.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lab-sql-021 | Không có lỗi — artifact nhất quán (log Hibernate 21 câu, pg_stat calls 180k vs 9k tỷ lệ 20:1, code p.getReviews() trong stream), answer trích đúng dòng, rubric 5 ý đo được | OK |
| lab-sql-022 | Không có lỗi — artifact nhất quán (HikariCP total=15/active=15, pg_stat idle in transaction xact_age tăng đều, @Transactional trên method 18 phút), answer trích đúng, rubric 5 ý | OK |
| lab-sql-023 | Không có lỗi — artifact nhất quán (EXPLAIN Seq Scan lower(status) vs Index Scan status='shipped', order_code::bigint cast phá index, schema xác nhận index tồn tại), answer trích đúng, rubric 5 ý | OK |
| lab-sql-024 | Không có lỗi — artifact nhất quán (Seq Scan ILIKE %java% 8.2s vs Bitmap Index Scan pg_trgm 79ms, schema chỉ có btree), answer trích đúng, rubric 5 ý | OK |

Tất cả 4 lab đã đạt chất lượng: artifact đúng định dạng EXPLAIN PostgreSQL/HikariCP/pg_stat_activity, tự nhất quán về số liệu/timestamp, answer tham chiếu đúng dòng trong artifact, cách sửa đúng kỹ thuật (sargable, batch commit, pg_trgm, DTO projection), rubric ≥ 3 ý cụ thể. Validation, syntax check, build-light-index đều PASS.
