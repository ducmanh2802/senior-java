# T2168 — Rà soát chất lượng 4 bài học mới nhất trong lessons-api.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-api.js`
After: T2080

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng 인터뷰 thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất (`node scripts/qtool.js list js/data/lessons-api.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật; giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test xác định; câu check đúng, explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-api-007 | Check questions thiếu định dạng "(Chọn N)" | Thêm "(Chọn 1)" vào 4 câu hỏi check |
| lesson-api-008 | Check questions thiếu định dạng "(Chọn N)" | Thêm "(Chọn 1)" vào 4 câu hỏi check |
| lesson-api-009 | Check questions thiếu định dạng "(Chọn N)" | Thêm "(Chọn 1)" vào 4 câu hỏi check |
| lesson-api-010 | Check questions thiếu định dạng "(Chọn N)" | Thêm "(Chọn 1)" vào 4 câu hỏi check |Reviewed-by: kilo (T2168R)
Reviewed-by: kilo (T2168R)
