# T2276 — Rà soát chất lượng các thẻ thuật ngữ tiếng Anh trong drills-term.js

Status: DONE
Agent: kilo
Owns: `js/data/drills-term.js`
After: T1722

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các thẻ thuật ngữ tiếng Anh (`node scripts/qtool.js list js/data/drills-term.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: định nghĩa tiếng Anh chuẩn, ví dụ câu dùng trong phỏng vấn tự nhiên, phát âm/ghi chú đúng; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/drills-term.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- Đã rà soát kỹ file `js/data/drills-term.js`. File có định dạng đúng, các thuật ngữ được giải thích chuẩn xác, phát âm gợi ý dễ hiểu, ví dụ phù hợp cho phỏng vấn.
- Đã kiểm tra kỹ 3 ID: `drill-term-003` (idempotent), `drill-term-024` (Kafka), `drill-term-053` (observability) - tất cả đều chính xác về định nghĩa, phát âm và ví dụ.
- Không phát hiện lỗi cần sửa.
- Lưu ý: Lệnh `node scripts/validate.js` vẫn báo lỗi trong file `quiz-spring.js` nhưng đây là lỗi ngoài phạm vi sở hữu của task này.
