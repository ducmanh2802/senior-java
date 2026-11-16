# T2237 — Rà soát chất lượng các câu tag 'core' trong q-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T2197

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu tag 'core' (`node scripts/qtool.js list js/data/q-sql.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: có ví dụ SQL cụ thể + EXPLAIN/plan PostgreSQL thật khi nói về index; có bảng so sánh khi so sánh isolation level/lock; sửa thông tin sai (MVCC, gap lock chỉ có ở MySQL InnoDB…).
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

- Reviewed core-tagged SQL items; factual points (MVCC, gap lock InnoDB-only, PostgreSQL no gap lock) already correct. No content changes needed; validate OK.
Reviewed-by: verify-only (review task)
