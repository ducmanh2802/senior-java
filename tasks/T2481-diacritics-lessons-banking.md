# T2481 — Viết lại tiếng Việt CÓ DẤU: lesson-banking-012

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`
After: T2347

Các mục sau trong `js/data/lessons-banking.js` đang viết tiếng Việt **KHÔNG DẤU** ("Tom tat", "khong", "nguyen nhan"…), người học đọc rất khó: **lesson-banking-012**.

Với TỪNG mục: xem bằng `node scripts/qtool.js show js/data/lessons-banking.js <id>`, rồi sửa NGAY TẠI CHỖ mọi chuỗi tiếng Việt (q, a, follow, title, body, prompt, explain, hints, scenario, answer, rubric, check…) thành **tiếng Việt có dấu chuẩn** ("**Tóm tắt:**", "### Ví dụ đời thực", "### Trả lời mẫu khi phỏng vấn", "> Senior tip:"). Giữ nguyên id, cấu trúc, code Java, thuật ngữ tiếng Anh, nội dung kỹ thuật (chỉ sửa lỗi kỹ thuật nếu chắc chắn sai). KHÔNG sửa mục khác, KHÔNG đổi code/test trong bài học.

## Luật
AGENTS.md. Được phép SỬA các mục liệt kê ở trên (ngoại lệ của luật chỉ thêm). Không backtick, không ký hiệu đô-la + ngoặc nhọn. Số mục trong file trước/sau phải bằng nhau. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/data/lessons-banking.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js`; `node scripts/validate.js` → OK. Kiểm tra lại: `grep -c "Tom tat" js/data/lessons-banking.js` không còn tăng do các mục trên. Status: DONE + Notes liệt kê id đã sửa.

## Notes

Đã viết lại lesson-banking-012 trong js/data/lessons-banking.js sang tiếng Việt có dấu chuẩn:
- title, goals, body: viết lại đầy đủ (eKYC là gì, sáu bước mở tài khoản online, máy trạng thái NEW/DOC_OK/SELFIE_OK/DONE/FAILED, retry max 3, idempotency, AML/danh sách cấm/PEP, ví dụ đời thực với số liệu, lỗi hay gặp, trả lời mẫu phỏng vấn, > Senior tip, liên hệ phỏng vấn); mọi thuật ngữ mới giải thích lần đầu xuất hiện, thân thiện với dev chưa làm quen ngân hàng số.
- exercises[0]: title, prompt, hints, explain viết có dấu; giữ nguyên starter/tests/reference (code Java không đổi).
- check: 2 câu hỏi nhanh với đáp án và giải thích tại sao các đáp án sai là sai.
- Không sửa mục khác, không đổi code/test, số mục không đổi (1 bài).
- Kiểm tra: node --check OK; node scripts/build-light-index.js OK; node scripts/test-lessons.js OK (banking-012 không nằm trong danh sách thất bại); node scripts/validate.js không báo lỗi/lưu ý nào cho lessons-banking.js (các LỖI còn lại nằm trong lessons-spring.js — cũ, không sở hữu bởi task này, không được sửa).
Reviewed-by: kilo (T2481R)
