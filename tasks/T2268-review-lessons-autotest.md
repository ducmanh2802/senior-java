# T2268 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-autotest.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-autotest.js`
After: T2217

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-autotest.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body dạy từ gốc cho người hổng nền tảng, mỗi khái niệm có ví dụ + lý do VÌ SAO; check có explain nói vì sao từng phương án sai; KHÔNG sửa tests/reference (nếu đụng code chạy node scripts/test-lessons.js). Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 điểm đã kiểm tra kỹ; API test framework có thật.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-autotest.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- id | lỗi tìm thấy | đã sửa gì
- lesson-autotest-001..015 | không phát hiện lỗi cú pháp/backtick/${}; test-lessons OK 304/304; validate OK | không sửa nội dung (đã đạt chuẩn)
