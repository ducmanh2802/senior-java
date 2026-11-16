# T2161 — Rà soát chất lượng 15 câu mới nhất (id lớn nhất) trong q-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2100

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu mới nhất (id lớn nhất) (`node scripts/qtool.js list js/data/q-ai.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật về LLM/RAG/agent (không bịa tên model, API, giá; Spring AI chỉ nêu khái niệm đã có thật); code Java hợp lệ; có **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| ai-121 | Tên extension PostgreSQL không chuẩn (pg_search) | Thay bằng full-text search tích hợp với {{tsvector}}/{{ts_rank}}, đồng nhất với ghi chú corpus (line 904) |
Reviewed-by: kilo (T2161R)
