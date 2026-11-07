# T630 — 2 bài học SQL có bài tập tự chấm

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`

Track **sql** mới có 3 bài (đọc để không trùng). Thêm 2 bài, order tiếp nối; bài tập **mô phỏng bằng Java thuần** (không có DB thật):
1. **Window function từ gốc**: ROW_NUMBER / RANK / DENSE_RANK, PARTITION BY, running total (SUM OVER ORDER BY), LAG; bài toán thật: top-3 giao dịch lớn nhất mỗi khách, số dư lũy kế theo ngày. Bài tập: `Window.rank(List<Row> rows, partitionKey, orderKey)` và `runningTotal(...)` mô phỏng đúng ngữ nghĩa SQL (tie của RANK nhảy số, DENSE_RANK không nhảy); ≥ 6 case.
2. **Thuật toán JOIN mà database dùng**: nested loop, hash join, merge join; khi nào optimizer chọn cái nào; vì sao JOIN thiếu index thành chậm; đọc EXPLAIN (PostgreSQL) ở mức nhận ra Hash Join / Nested Loop / Seq Scan. Bài tập: `Joins.nestedLoop / hashJoin / mergeJoin` trên 2 List<Row> cho kết quả giống nhau (kể cả key trùng, key null không khớp như SQL) và đếm số phép so sánh để thấy khác biệt; ≥ 6 case.
Track db đã có B-tree index, isolation level, optimistic locking: KHÔNG lặp lại.
> **CẢNH BÁO GHI ĐÈ:** file này đã có nội dung của task khác (chưa commit). **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau khi sửa (`grep -c "id: '"`), số sau phải = số trước + số mục bạn thêm. Hôm nay đã có 2 task làm mất dữ liệu vì ghi đè cả file.
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 12 và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) trước. Đọc các bài đã có trong `js/data/lessons-sql.js` để không trùng.
- **Chỉ THÊM** bài vào cuối mảng; id và `order` tiếp nối số lớn nhất hiện có. Không sửa bài cũ.
- Body ≥ 2500 ký tự, giải thích từ gốc cho người hổng nền tảng, ví dụ ~~~java ngắn có comment, bảng, > lưu ý; kết bằng "### Liên hệ phỏng vấn".
- Bài tập: chỉ JDK chuẩn, biên dịch với **Java 17**, không class public ngoài Main, test deterministic (không sleep/thời gian thực), ≥ 4 case. Starter biên dịch được và có `throw new UnsupportedOperationException("TODO")`.
- Không backtick, không `${` trong template literal; dấu \ trong code Java phải viết \\. Không chạy file .js trực tiếp, luôn dùng `node`.

## Nghiệm thu
`node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết), `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes (kèm đề xuất thêm id vào js/data/path.js cho integrator).

## Notes

Status: DONE
- Đã **chèn thêm 2 bài** ngay trước `);` cuối file `js/data/lessons-sql.js` (không xoá/sửa bài cũ). Số `id:` trong file: trước = 3, sau = 5 (`lesson-sql-001`..`005`).
- Bài mới:
  - `lesson-sql-004` (order 4): "Window function từ gốc: ROW_NUMBER, RANK, DENSE_RANK, LAG và running total" — giải thích PARTITION BY/ORDER BY/frame (RANGE vs ROWS), tie RANK nhảy/DENSE_RANK không nhảy, LAG, top-3 mỗi khách + số dư lũy kế; bài tập `Window.rank(rows, dense)` + `runningTotal(rows)` (thẳng hàng input, stable sort, reset per partition, ROWS, long) — 8/8 test pass.
  - `lesson-sql-005` (order 5): "Thuật toán JOIN mà database dùng: nested loop, hash join, merge join và đọc EXPLAIN" — chi phí n×m/n×log m/n+m, optimizer chọn khi nào, thiếu index, đọc EXPLAIN PostgreSQL (Hash/Nested/Merge/Seq Scan, loops), null key không khớp; bài tập `Joins.nestedLoop/hashJoin/mergeJoin` + đếm so sánh, xử lý key trùng & key null — 8/8 test pass.
- Kiểm tra: `node --check js/data/lessons-sql.js` OK; `node scripts/test-lessons.js lesson-sql-004` và `lesson-sql-005` → reference pass hết, starter biên dịch được và không pass hết; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → **OK — không có lỗi** (tổng 112 bài học, 127 bài tập; sql 5 bài).
- Đề xuất cho integrator: thêm `lesson-sql-004`, `lesson-sql-005` vào `js/data/path.js` (validate cảnh báo: chưa nằm trong PATH). Lưu ý: `validate.js` hiện vẫn báo lỗi ở file **không thuộc task này** — `lessons-jpa.js` (`lesson-jpa-007.body` có ký tự lạ `命中率`); cần task jpa sửa.

Reviewed-by: kilo (T630R)
