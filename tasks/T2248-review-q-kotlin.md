# T2248 — Rà soát chất lượng các câu về coroutines, null-safety, Kotlin + Spring trong q-kotlin.js

Status: DONE
Agent: kilo

## Ghi chú
- Đã rà soát 35 câu hỏi trong `js/data/q-kotlin.js` tập trung vào coroutines, null-safety và Kotlin + Spring.
- Nội dung đã đạt chuẩn, tuân thủ yêu cầu chi tiết cho senior dev.
- Validate OK.
Owns: `js/data/q-kotlin.js`
After: T2170

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu về coroutines, null-safety, Kotlin + Spring (`node scripts/qtool.js list js/data/q-kotlin.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: coroutines đúng (structured concurrency, Dispatchers.IO, suspend vs blocking); interop Java đúng; ví dụ code chạy được.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-kotlin.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
