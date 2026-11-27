# T2807 — Case khó Upwork: thanh toán và hợp đồng, vòng 2 (6 case)

Status: DONE
Agent: kilo
Owns: `js/data/upwork-cases-1.js`
After: T2804

Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.
**Đọc mọi chương/case đã có trong các file upwork-*.js để KHÔNG trùng ý.**

Thêm **6 case** `uw-case-008`…`uw-case-013` vào `js/data/upwork-cases-1.js` (dải id của file này: 001–099). Mỗi case đủ mọi field, steps 1500–3500 ký tự có nhánh "nếu khách làm X thì…", 2–3 tin nhắn mẫu:
- (payment) Khách đã duyệt milestone, 1 tháng sau đòi hoàn tiền vì "phát hiện bug".
- (payment) Khách đề nghị trả bonus/tip ngoài Upwork qua PayPal hoặc chuyển khoản "cho nhanh".
- (contract) Khách muốn chuyển hợp đồng fixed-price đang dở sang hourly (hoặc ngược lại): khi nào đồng ý, cách chuyển sạch.
- (contract) Khách mời làm full-time/dài hạn ngoài Upwork sau 3 tháng hợp tác tốt: conversion fee, so sánh, cách trả lời.
- (contract) Hợp đồng hourly có weekly limit 10 giờ nhưng khách giao việc cần 25 giờ/tuần và giục deadline.
- (contract) Khách là agency/trung gian thuê lại bạn cho khách cuối: ai sở hữu code, ai chịu trách nhiệm, rủi ro khi khách cuối không trả agency.

## Luật
- Đọc AGENTS.md (mục 5–6). **Tiếng Việt CÓ DẤU đầy đủ**; tin nhắn mẫu gửi khách bằng tiếng Anh tự nhiên.
- **Chỉ THÊM** vào file sở hữu (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác.
- Không backtick, không `${` trong template literal. Trong `templates[].text` dùng chuỗi nháy đơn, xuống dòng bằng \n.
- **Đúng sự thật về Upwork**: phí, giá Connects, ngưỡng badge/JSS, số ngày của các mốc thay đổi theo thời gian — chỉ ghi con số khi chắc chắn, kèm "(tại thời điểm viết, kiểm tra lại trên Upwork Help)". Không chắc thì mô tả cơ chế. Không bịa tên tính năng/nút bấm. Thuế/pháp lý Việt Nam: chỉ nêu nguyên tắc và khuyên hỏi chuyên gia, không ghi thuế suất.
- Người đọc: dev Java ~4 năm ở Việt Nam, mới làm freelance: giải thích thuật ngữ ở lần đầu (escrow, JSS, Connects…), ví dụ cụ thể có số tiền, ngày, tin nhắn.

## Nghiệm thu
`node --check js/data/upwork-cases-1.js`; `node scripts/check-upwork.js` → `OK — dữ liệu Upwork hợp lệ.`; `node scripts/validate.js` không có lỗi nào thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 case vào `js/data/upwork-cases-1.js` (chèn trước `);` cuối file, không sửa case cũ):
- uw-case-008 (payment, senior, high): khách đã duyệt milestone, 1 tháng sau đòi hoàn tiền vì "phát hiện bug" (lỗi do nhánh mới của khách, không có idempotency).
- uw-case-009 (payment, senior, high): khách muốn trả bonus/chuyển lương ngoài Upwork qua PayPal/chuyển khoản "cho nhanh" (circumvention, đề xuất bonus qua hợp đồng).
- uw-case-010 (contract, senior, medium): chuyển fixed-price đang dở sang hourly/ngược lại (đóng đúng, mở đúng, không bỏ milestone funded).
- uw-case-011 (contract, lead, high): khách mời full-time/dài hạn ngoài Upwork sau 3 tháng (non-circumvention 24 tháng, conversion fee, retainer trên Upwork).
- uw-case-012 (contract, senior, high): hourly weekly limit 10h nhưng việc 25h và giục deadline (limit là trần cứng, nâng limit/fixed cho phần vượt).
- uw-case-013 (contract, lead, high): agency/trung gian thuê lại cho khách cuối (ai sở hữu code, ai chịu trách nhiệm, escrow bảo vệ khi khách cuối không trả agency).

Kiểm tra: `node --check js/data/upwork-cases-1.js` OK; `node scripts/check-upwork.js` → OK (9 chương, 31 case); `node scripts/validate.js` không có lỗi nào thuộc file này (các lỗi còn lại thuộc q-kotlin/quiz-ops/lessons-* của task khác). Không commit, không mở trình duyệt.
Reviewed-by: verify-only (code/UI task)
