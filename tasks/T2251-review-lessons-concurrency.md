# T2251 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-concurrency.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`
After: T2222

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-concurrency.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body có sơ đồ/timeline cho race condition, happens-before; check có explain từng phương án; đúng Java 17/21; KHÔNG sửa tests/reference.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-concurrency.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-concurrency-012 | body table safe-publication: 2 hàng dùng `~~~java ... ~~~` bên trong template literal (backtick) → validator báo "inline code chứa backtick", đồng thời `{` `}` lồng nhau trong `{{...}}` | thay bằng inline code không có dấu ngoặc nhọn lồng: `{{final int x; Holder(int v) -> x = v; holder = new Holder(42);}}` và `{{synchronized (lock) -> holder = new Holder(42); synchronized (lock) -> h = holder;}}` |
| (không có) | số bài trước/sau = 18, check q=explain=answer/options = 18/18; body đã có sơ đồ `~~~seq` (lesson-008), timeline fixed/sliding window (lesson-007), ABA scenario (lesson-011); check đã có explain từng phương án | chỉ sửa markup, không đổi nội dung, tests/reference untouched |
Reviewed-by: verify-only (review task)
