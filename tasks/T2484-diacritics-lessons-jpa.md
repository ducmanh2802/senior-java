# T2484 — Viết lại tiếng Việt CÓ DẤU: lesson-jpa-012, lesson-jpa-013

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`
After: T2331

Các mục sau trong `js/data/lessons-jpa.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **lesson-jpa-012, lesson-jpa-013**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/lessons-jpa.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/lessons-jpa.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/lessons-jpa.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes

lesson-jpa-012, lesson-jpa-013: toàn bộ prose (title, body, goals, prompt, explain, hints, check) đã có dấu chuẩn (ví dụ: "**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Đã giữ nguyên id, cấu trúc, code Java và thuật ngữ tiếng Anh. Code comment, sơ đồ `~~~text` và chuỗi detail trong `tests` không được thay đổi theo quy tắc "KHÔNG đổi code/test trong bài học". node --check OK, build-light-index OK, test-lessons (lesson-jpa-012/013) pass, validate.js không báo lỗi cho lessons-jpa.js (các lỗi validate còn lại chỉ ở lessons-spring.js, ngoài phạm vi sở hữu của task này).Reviewed-by: kilo (T2484R)
