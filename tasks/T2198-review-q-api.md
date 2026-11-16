# T2198 — Rà soát chất lượng 15 câu KHÔNG có tag core, id lớn nhất trong q-api.js

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T2138

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu KHÔNG có tag core, id lớn nhất (`node scripts/qtool.js list js/data/q-api.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6, PostgreSQL 15+, Kafka 3.x; không bịa API/flag/giá trị mặc định; câu không có tag core cũng phải đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; ghi vào Notes nếu trùng ý câu khác.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa ghi |
|---|---|---|
| api-012 | none | không có lỗi kỹ thuật, có đầy đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: |
| api-013 | none | không có lỗi kỹ thuật, có đầy đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: |
| api-017 | none | không có lỗi kỹ thuật, có đầy đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: |
| api-021 | none | không có lỗi kỹ thuật, có đầy đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: |
| api-022 | none | không có lỗi kỹ thuật, có đầy đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: |
| api-023 | none | không có lỗi kỹ thuật, có đầy đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: |
| api-024 | none | không có lỗi kỹ thuật, có đầy đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip: |