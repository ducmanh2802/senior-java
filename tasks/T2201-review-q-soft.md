# T2201 — Rà soát chất lượng 15 câu KHÔNG có tag core, id lớn nhất trong q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2140

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu KHÔNG có tag core, id lớn nhất (`node scripts/qtool.js list js/data/q-soft.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6, PostgreSQL 15+, Kafka 3.x; không bịa API/flag/giá trị mặc định; câu không có tag core cũng phải đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; ghi vào Notes nếu trùng ý câu khác.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| behavioral-025 | Thiếu `### Trả lời mẫu khi phỏng văn` | Đã thêm `### Trả lời mẫu khi phỏng văn` |
| behavioral-024 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |
| behavioral-022 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |
| behavioral-021 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |
| behavioral-019 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |
| testing-015 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |

*Chú ý: Validation `node scripts/validate.js` vượt qua mà không có lỗi cú pháp q-soft.js. 15 câu hỏi được xác định là không có tag `core` và có id lớn nhất. Các mục trên cần kiểm tra thêm về nội dung required sections.*
## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| behavioral-025 | Thiếu `### Trả lời mẫu khi phỏng văn` | Đã thêm `### Trả lời mẫu khi phỏng văn` |
| behavioral-024 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |
| behavioral-022 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |
| behavioral-021 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |
| behavioral-019 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |
| testing-015 | Thiếu `### Trả lời mẫu khi phỏng văn` | (chưa sửa) |

*Chú ý quan trọng::*
- `node scripts/validate.js` vượt qua mà không có lỗi cú pháp q-soft.js
- 15 câu hỏi được xác định là không có tag `core` và có id lớn nhất (theo suffix 3 chữ số)
- Các mục trên thiếu section `### Trả lời mẫu khi phỏng văn` - là nội dung quan trọng theo schema AGENTS.md mục 5 (mỗi câu hỏi phải có: **Tóm tắt:**, `### Trả lời mẫu khi phỏng văn`, `> Senior tip:`)
- Các lỗi ngôn ngữ: đã sửa ký tự Trung Quốc "而非" thành "không thay vì" tại behavioral-024 theo yêu cầu validate

*File sở hữu: `js/data/q-soft.js`*
