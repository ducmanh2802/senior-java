# T2162 — Rà soát chất lượng 15 câu tiếng Anh mới nhất (lang: en) trong q-english.js

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`
After: T1721

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu tiếng Anh mới nhất (lang: en) (`node scripts/qtool.js list js/data/q-english.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: tiếng Anh tự nhiên, đúng ngữ pháp, giọng phỏng vấn Senior thật; câu mẫu 150–220 từ; không lẫn tiếng Việt trong phần câu trả lời mẫu (giải thích tiếng Việt được phép ở mục riêng); từ vựng kỹ thuật dùng đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-english.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| english-206 | Câu trả lời mẫu 230 từ (vượt giới hạn 220 từ) | Rút gọn câu mẫu xuống 206 từ: gộp/bớt từ đệm, viết lại mượt mà hơn |
| english-207 | Câu trả lời mẫu 232 từ (vượt giới hạn 220 từ) | Rút gọn câu mẫu xuống 189 từ: gộp mô tả team, rút gọn 3 giải pháp, gọn kết quả |
| english-208 | Câu trả lời mẫu 226 từ (vượt giới hạn 220 từ) | Rút gọn câu mẫu xuống 192 từ: gộp phần chia 2 phần, rút gọn spike, gọn phần client |

Các câu còn lại (english-195 đến english-205, english-209) đã đúng chuẩn: 150–220 từ, tiếng Anh tự nhiên, ngữ pháp đúng, giọng Senior, không lẫn tiếng Việt trong câu mẫu, thuật ngữ kỹ thuật chính xác.
Reviewed-by: kilo (T2162R)
