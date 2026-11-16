# T2217 — Rà soát chất lượng 4 bài học mới nhất trong lessons-autotest.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-autotest.js`
After: T1041

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (`node scripts/qtool.js list js/data/lessons-autotest.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật; giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test ≥ 3 case xác định; câu check đúng, explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-autotest.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-autotest-012 | (none) | Không sửa |
| lesson-autotest-013 | (none) | Không sửa |
| lesson-autotest-014 | (none) | Không sửa |
| lesson-autotest-015 | (none) | Không sửa |

Ghi chú: ban đầu lo ngại `related` trỏ id autotest-008/009/013 không tồn tại, nhưng kiểm tra lại thấy q-autotest.js dùng double-quote cho id 005–015 nên tất cả `related` đều hợp lệ. Không có lỗi kỹ thuật, không sửa nội dung. Các lệnh nghiệm thu đều OK: `node --check`, `test-lessons.js` (300/300), `validate.js`, `build-light-index.js`.

Xác minh lại (lần chạy sau): đọc toàn bộ 4 bài 012–015, kiểm tra tay từng bài tập so với reference/test (StubServer, RouteTable glob DP, PixelDiff, SchemaValidator) — tất cả khớp, không có lỗi kỹ thuật; đếm mục trước/sau bằng nhau (15 bài học, không xoá/đổi id). Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → "OK — không có lỗi."; `node scripts/test-lessons.js` → 300/300. Không sửa nội dung.
