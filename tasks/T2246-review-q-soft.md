# T2246 — Rà soát chất lượng các câu behavioral/leadership trong q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2201

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu behavioral/leadership (`node scripts/qtool.js list js/data/q-soft.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: mỗi câu có khung STAR rõ và ### Trả lời mẫu khi phỏng vấn 150–220 từ có số liệu cụ thể; tránh câu sáo rỗng; Tóm tắt 1–2 câu.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| behavioral-001 → behavioral-054 (tất cả 54 mục) | Không có lỗi nào. Mọi mục đã có khung STAR rõ ràng, `### Trả lời mẫu khi phỏng vấn` 150–220 từ kèm số liệu cụ thể, và `**Tóm tắt:**` 1–2 câu. | Không cần sửa. Số mục trước/sau bằng nhau (54/54), không đổi id. |
