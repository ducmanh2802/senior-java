# T2480 — Viết lại tiếng Việt CÓ DẤU: lab-thread-018

Status: DONE
Agent: kilo
Owns: `js/data/labs-thread.js`
After: T2440

Các mục sau trong `js/data/labs-thread.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **lab-thread-018**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/labs-thread.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/labs-thread.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/labs-thread.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes
Đã sửa lab-thread-018: title, scenario, questions, hints, answer, rubric — toàn bộ tiếng Việt không dấu được chuyển sang có dấu chuẩn. Artifacts (jstack, scheduler-metrics, SchedulerConfig) giữ nguyên vì là log/code thật. Validation pass: node scripts/validate.js OK, node scripts/build-light-index.js OK.
Reviewed-by: kilo (T2480R)
