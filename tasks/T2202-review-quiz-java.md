# T2202 — Rà soát chất lượng 30 câu id lớn nhất trong quiz-java.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-java.js`
After: T2068

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 30 câu id lớn nhất (`node scripts/qtool.js list js/data/quiz-java.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đáp án đúng thật sự đúng (Java 17/21, Spring Boot 3, Hibernate 6, AWS/K8s hiện hành); không có 2 phương án cùng đúng ở câu 1 đáp án; multi có (Chọn N) khớp; explain giải thích đúng + vì sao từng phương án sai; đáp án đúng rải đều vị trí.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/quiz-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

id | lỗi tìm thấy | đã sửa gì
---|---|---
qz-concurrency-041 | Thiếu (Chọn 2) trong câu hỏi | Thêm "(Chọn 2)" vào q field