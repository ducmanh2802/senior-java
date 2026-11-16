# T2167 — Rà soát chất lượng 4 bài học mới nhất trong lessons-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`
After: T1711

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (`node scripts/qtool.js list js/data/lessons-sql.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật; giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test xác định; câu check đúng, explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- 4 bài mới nhất (theo id/order): `lesson-sql-010`, `lesson-sql-011`, `lesson-sql-012`, `lesson-sql-013`.
- Số mục trước/sau trong `js/data/lessons-sql.js`: **11 / 11** (không đổi id, không xoá/thêm mục).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-sql-010 | Thuật ngữ B-tree chưa được giải thích rõ ở lần nhắc đến index/heap (người mới dễ hổng). | Bổ sung giải thích ngắn "B-tree (cây cân bằng giữ dữ liệu có thứ tự, tra cứu theo giá trị/khoảng ~log n bước)" tại phần Seq Scan và câu mô tả Index Scan; nội dung kỹ thuật, ví dụ, test, check giữ nguyên. |
| lesson-sql-011 | Không thấy lỗi kỹ thuật/cú pháp; giải thích offset vs keyset, tie-breaker, cursor, trade-off và ví dụ số liệu rõ; bài tập/test xác định và explain đúng. | Không sửa. |
| lesson-sql-012 | Không thấy lỗi kỹ thuật/cú pháp; EXPLAIN ANALYZE, Seq/Index/Bitmap scan, Filter vs Index Cond, Hash/Nested loop, Batches/work_mem trình bày đúng; bài tập/test xác định. | Không sửa. |
| lesson-sql-013 | Không thấy lỗi kỹ thuật/cú pháp; keyset trên danh sách đã sắp, tie-breaker, mô phỏng offset vs cursor và trade-off đúng; bài tập/test xác định. | Không sửa. |

- Kiểm tra: `node --check js/data/lessons-sql.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` OK; `node scripts/test-lessons.js` OK (298/298, 297 từ cache). Không có backtick hay `${` trong file. Không commit.
Reviewed-by: kilo (T2167R)
