# T2271 — Rà soát chất lượng các câu trắc nghiệm trong quiz-ccap-1.js

Status: DONE
Notes:
| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-ccap-097 | Không có | Kiểm tra kỹ kiến thức đánh giá model, OK |
| qz-ccap-098 | Không có | Kiểm tra kỹ kiến thức metric chất lượng, OK |
| qz-ccap-099 | Không có | Kiểm tra kỹ kiến thức bảo mật (prompt injection), OK |
Agent: kilo
Owns: `js/data/quiz-ccap-1.js`
After: T2181

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu trắc nghiệm (`node scripts/qtool.js list js/data/quiz-ccap-1.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kiến thức Claude API hiện hành (Fable 5.2 $8/$40, Opus 5.5 $4/$20, Sonnet 5.5 $2/$10, Haiku 5.5 $0.10/$0.50; budget_tokens/temperature/prefill bị 400 trên model mới); phương án nhiễu hợp lý; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-ccap-1.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
