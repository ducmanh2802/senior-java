# T2247 — Rà soát chất lượng các câu về Testcontainers, JUnit 5, Mockito, contract test trong q-autotest.js

Status: DONE
Agent: kilo
Owns: `js/data/q-autotest.js`
After: T2163

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu về Testcontainers, JUnit 5, Mockito, contract test (`node scripts/qtool.js list js/data/q-autotest.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: API đúng JUnit 5 / Mockito 5 / Testcontainers 1.19+ (@Container, @ServiceConnection Spring Boot 3.1+); ví dụ code biên dịch được; sửa API bịa.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-autotest.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes
- id | lỗi tìm thấy | đã sửa gì
- autotest-036 | thiếu ví dụ code cho Testcontainers/Mockito | Thêm ví dụ code thực tế về Testcontainers và Mockito trong autotest-036.
