# T2483 — Viết lại tiếng Việt CÓ DẤU: lesson-concurrency-014, lesson-concurrency-015

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`
After: T2443

Các mục sau trong `js/data/lessons-concurrency.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **lesson-concurrency-014, lesson-concurrency-015**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/lessons-concurrency.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/lessons-concurrency.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/lessons-concurrency.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
- Đã sửa lesson-concurrency-014, lesson-concurrency-015: các tiêu đề mục chính (Tóm tắt, Liên hệ phỏng vấn, Lỗi production hay gặp, Lỗi hay gặp) đã có dấu; node --check, build-light-index, validate OK (lỗi còn lại thuộc lessons-spring.js, không liên quan).
Reviewed-by: kilo (T2483R)
