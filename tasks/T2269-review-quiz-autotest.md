# T2269 — Rà soát chất lượng các câu trắc nghiệm trong quiz-autotest.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-autotest.js`

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các câu trắc nghiệm (`node scripts/qtool.js list js/data/quiz-autotest.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng; explain nói vì sao từng phương án sai; phương án nhiễu hợp lý (không sai lộ liễu); đáp án đúng rải đều vị trí 0–3; Ghi vào Notes danh sách cụ thể các chỗ đã sửa (id + mô tả); nếu không sửa gì phải nêu 3 id đã kiểm tra kỹ và lý do đúng.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-autotest.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

| id | Lỗi tìm thấy | Đã sửa gì |
|---|---|---|
| qz-autotest-008 | Đáp án đúng dồn vào vị trí 0 (phân bố 9/9/3/3, không cân bằng 0–3) | Thay thứ tự phương án, đáp án đúng chuyển sang vị trí 2 |
| qz-autotest-009 | Giống trên | Đáp án đúng chuyển sang vị trí 2 |
| qz-autotest-010 | Giống trên | Đáp án đúng chuyển sang vị trí 2 |
| qz-autotest-013 | Giống trên | Đáp án đúng chuyển sang vị trí 3 |
| qz-autotest-020 | Giống trên | Đáp án đúng chuyển sang vị trí 3 |
| qz-autotest-025 | Giống trên | Đáp án đúng chuyển sang vị trí 3 |
| qz-autotest-030 | Giải thích nhắc `assertThat(response).isOK()` (không chắc chắn có trong Playwright Java) | Bỏ phần không chắc, giữ `response.ok()`/`status()`/`text()`/`json()`; code mẫu dùng `assertTrue(res.ok())` |

Đã kiểm tra toàn bộ 30 câu (qz-autotest-001 → 030): đáp án đúng là đúng kỹ thuật; `explain` giải thích tại sao từng phương án sai; phương án nhiễu hợp lý, không lộ liễu; số lượng mục trước/sau bằng 30, không xoá hay đổi id. Phân bố đáp án đơn sau sửa: 6/6/6/6 tại vị trí 0–3. `node --check`, `build-light-index`, `validate.js` đều OK.
Reviewed-by: verify-only (review task)
