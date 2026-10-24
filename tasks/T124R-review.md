# T124R — Fact-check nội dung mới của T124

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T124 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review 8 câu mới `sql-015`…`sql-022`. Tổng thể tốt, chỉ cần sửa tại chỗ — chi tiết theo từng id:

- `sql-015`: (1) "Rows Removed by Filter – chỉ có ở Seq Scan / Index Scan" → sửa thành "chỉ hiện ở node có Filter (Seq Scan / Index Scan / Bitmap Heap Scan)" — Bitmap Heap Scan cũng in dòng này. (2) Bảng "loops": "tổng = vòng × loops" mơ hồ → làm rõ actual `rows` là trung bình mỗi vòng, tổng = `rows` × `loops`.
- `sql-016`: (1) Thiếu dấu đóng ngoặc trong ⇥ `{{NOT (a = b OR (a IS NULL AND b IS NULL)}}` → thêm `)` cuối. (2) "tự khử trùng" dùng sai nghĩa khi nói EXCEPT → "EXCEPT tự loại bản sao".
- `sql-017`: (1) Tên cột trong `pg_stats` bịa: `most_common_values`/`histogram` → đúng là `most_common_vals`/`histogram_bounds`. (2) "ndistinct cần PostgreSQL 14+" sai — n_distinct có từ PostgreSQL 10 (mcv mới từ 12) → sửa theo đúng mốc.
- `sql-018`: "ứng viên bị drop" (chỉ index) → "index đó nên bị drop" cho rõ.
- `sql-019`: **lỗi logic lớn nhất**: query tính `online_seconds = SUM(duration từng dòng)` trong khi chính phần Edge cases nói "cộng duration từng dòng là sai vì phần chồng bị đếm 2 lần" → sửa thành `EXTRACT(EPOCH FROM (MAX(end_ts) - MIN(start_ts)))` + comment giải thích (đảo gộp là nửa mở [min start, max end)).
- `sql-020`: bitmask `GROUPING(region, product)` nói **ngược** — PostgreSQL cho bit thấp nhất ứng với cột cuối (product bị gộp → 1, region bị gộp → 2, tổng cộng → 3) → sửa.
- `sql-021`: EXPLAIN ghi "Subquery Scan → đã inline" sai — subquery inline (flattened) thì node Subquery Scan biến mất, plan hiện thẳng node bên trong với điều kiện đẩy vào → sửa comment.
- `sql-022`: đúng — đã đối chiếu default (`parallel_setup_cost=1000`, `parallel_tuple_cost=0.1`, `min_parallel_table_scan_size=8MB`, `max_parallel_workers_per_gather=2`), parallel index scan chỉ btree, danh sách điều kiện cấm parallel — không cần sửa.

Không sửa nội dung đã có ở HEAD; không thêm/xoá câu. Nội dung đã kiểm: cú pháp SQL, số liệu mặc định, version PostgreSQL, nhầm lẫn cơ chế (fence CTE, visibility map, GROUPING bitmask, partial index với bind parameter).

Kết quả nghiệm thu:
- `node --check js/data/q-sql.js` → không lỗi cú pháp.
- `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo duy nhất là 9 câu english đã có sẵn, thuộc file khác).
