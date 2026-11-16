# T2206 — Rà soát chất lượng 4 bài học mới nhất trong lessons-collections.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-collections.js`
After: T1528

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (`node scripts/qtool.js list js/data/lessons-collections.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21; giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test ≥ 3 case xác định; câu check đúng, explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-collections.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- 4 bài mới nhất: `lesson-collections-006`, `007`, `008`, `009` (grep -n theo id). Tổng bài trước/sau: 9/9.
- Kiểm tra: `node --check js/data/lessons-collections.js` OK; `node scripts/test-lessons.js lesson-collections-006..009` đều pass (006: 2/2 bài, 007: 2/2, 008: 1/1, 009: 1/1); `node scripts/build-light-index.js` + `node scripts/validate.js` → OK (0 lỗi).
- Rà soát kỹ thuật/markup (không backtick, không `${`), giải thích thuật ngữ, ví dụ có comment, test ≥3 deterministic, check/explain đúng: không phát hiện lỗi kỹ thuật hay vi phạm cần sửa.

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-collections-006 | Không phát hiện lỗi kỹ thuật/markup | Không sửa (giữ nguyên) |
| lesson-collections-007 | Không phát hiện lỗi kỹ thuật/markup | Không sửa (giữ nguyên) |
| lesson-collections-008 | Không phát hiện lỗi kỹ thuật/markup | Không sửa (giữ nguyên) |
| lesson-collections-009 | Không phát hiện lỗi kỹ thuật/markup | Không sửa (giữ nguyên) |
