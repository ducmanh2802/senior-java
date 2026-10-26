# T275 — Dịch sang tiếng Anh: lessons-design (5 mục)

Status: DONE
Agent: opencode

Đã dịch 5 bài học (lesson-design-001 đến 005) sang tiếng Anh trong `js/i18n/lessons-design-1.en.js`.
- Đảm bảo thuật ngữ kỹ thuật và markup được giữ nguyên.
- Đã kiểm tra cú pháp bằng `node --check`.
- `node scripts/check-i18n.js lessons-design-1` báo OK.
- `node scripts/validate.js` gặp lỗi ở `lessons-devops.js` (không thuộc phạm vi task này).

## Notes
- `js/data/lessons-devops.js:514` có lỗi cú pháp (Unexpected token '...') làm `node scripts/validate.js` thất bại. Cần người sở hữu file đó sửa lại.
- Các field dịch tuân thủ đúng schema của i18n overlay.

## Notes
