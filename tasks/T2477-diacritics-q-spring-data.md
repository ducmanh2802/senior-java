# T2477 — Viết lại tiếng Việt CÓ DẤU: spring-048, spring-049, spring-050, spring-051

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2448

Các mục sau trong `js/data/q-spring-data.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **spring-048, spring-049, spring-050, spring-051**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/q-spring-data.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/q-spring-data.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
Đã sửa 4 câu hỏi: spring-048, spring-049, spring-050, spring-051. Tất cả chuỗi tiếng Việt không dấu (q, a, follow, "Tom tat" -> "Tóm tắt", "### Vi du doi thuc" -> "### Ví dụ đời thực", "### Tra loi mau khi phong van" -> "### Trả lời mẫu khi phỏng vấn", "> Senior tip:" giữ nguyên) đã được chuyển sang tiếng Việt có dấu chuẩn. Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh. Validation pass (các lỗi hiện có trong validate.js là ở file khác: lessons-spring.js, labs-thread.js, không liên quan đến 4 câu hỏi này).
Reviewed-by: kilo (T2477R)
