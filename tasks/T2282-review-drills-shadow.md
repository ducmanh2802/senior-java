# T2282 — Rà soát chất lượng các bài shadowing tiếng Anh trong drills-shadow.js

Status: DONE

## Notes
Đã kiểm tra toàn bộ 198 bài shadowing (drill-shadow-001 đến drill-shadow-198). Nội dung tự nhiên, đúng ngữ pháp và độ dài phù hợp để luyện nói.

3 ví dụ kiểm tra kỹ:
- drill-shadow-001: Câu giới thiệu chuẩn, rõ ràng, 15 từ.
- drill-shadow-034: Định nghĩa kỹ thuật chuẩn về Observability, 12 từ.
- drill-shadow-059: Câu về hiệu quả công việc, tự nhiên, 12 từ.
Agent: kilo
Owns: `js/data/drills-shadow.js`
After: T1723

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài shadowing tiếng Anh (`node scripts/qtool.js list js/data/drills-shadow.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: câu tiếng Anh tự nhiên, đúng ngữ pháp, độ dài vừa nói 1 hơi; thuật ngữ đúng; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/drills-shadow.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
Reviewed-by: verify-only (review task)
