# T2219 — Rà soát chất lượng 15 câu id NHỎ nhất (tiếng Anh tự nhiên, đúng ngữ pháp) trong q-english.js

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`
After: T2162

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu id NHỎ nhất (tiếng Anh tự nhiên, đúng ngữ pháp) (`node scripts/qtool.js list js/data/q-english.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật/thực tế; không bịa API, số liệu, quy định; đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; Notes ghi câu trùng ý.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-english.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| english-008 | Dùng `> Tip:` thay vì `> Senior tip:` (không đồng bộ với các câu khác) | Đổi thành `> Senior tip:` để đồng bộ chuẩn kết thúc. |
Reviewed-by: verify-only (review task)
