# T2150 — Rà soát chất lượng 4 bài học mới nhất trong lessons-jpa.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`
After: T2104

## Bối cảnh
Nội dung mới do model free viết chưa được kiểm tra chéo. Giai đoạn này ưu tiên **chất lượng** hơn số lượng: người học (dev Java ~4 năm, hổng nền tảng) dùng để đi phỏng vấn thật.

## Việc cần làm
1. Tìm 4 bài học mới nhất trong `js/data/lessons-jpa.js` (grep -n theo id, hoặc `node scripts/qtool.js` nếu hỗ trợ file này). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body đúng kỹ thuật (Java 17/21, Spring Boot 3, Hibernate 6); giải thích từ gốc cho người hổng nền tảng; ví dụ code có comment; bài tập mô phỏng đúng cơ chế, test xác định; explain nêu lỗi hay gặp; câu check có đáp án đúng và explain đủ.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema của loại dữ liệu này; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-jpa.js`; `node scripts/build-light-index.js`; node scripts/test-lessons.js; node scripts/validate.js → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì` (không lỗi ghi "OK").

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-jpa-012 | Thiếu `> Senior tip:` kết thúc body (AGENTS.md mục 6 yêu cầu kết thúc bằngSenior tip) | Thêm `> Senior tip:` về N+1: cách đo thực tế, chọn giải pháp theo use case, ưu tiên DTO projection, cảnh báo không dùng EAGER |
| lesson-jpa-013 | Thiếu `> Senior tip:` kết thúc body | Thêm `> Senior tip:` về entity lifecycle: debug entity managed/detached, dùng instance trả về từ save(), @Modifying cho update một field |
| lesson-jpa-014 | Thiếu `> Senior tip:` kết thúc body | Thêm `> Senior tip:` về persistence context: kiểm tra managed state khi debug UPDATE, ưu tiên DTO projection/hai query IN cho list lớn, đo thực tế |
| lesson-jpa-015 | OK | OK — body đã có đủ `### Tóm tắt`, `### Trả lời mẫu khi phỏng vấn`, `### Liên hệ phỏng vấn`; exercises và check đúng kỹ thuật; test pass 7/7 và 5/5 |

Sau khi sửa: `node --check js/data/lessons-jpa.js` → OK; `node scripts/build-light-index.js` → OK; `node scripts/test-lessons.js` → 296/296; `node scripts/validate.js` → OK — không có lỗi. Số bài học vẫn 15, số bài tập vẫn 29 (không thêm/xóa mục).
Reviewed-by: kilo (T2150R)
