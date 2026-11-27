# T2804 — Case khó Upwork: thanh toán và hợp đồng (6 case)

Status: DONE
Agent: kilo
Owns: `js/data/upwork-cases-1.js`


Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.

Thêm **6 case** `uw-case-002`…`uw-case-007` vào `js/data/upwork-cases-1.js` (dải id của file này: 001–099). Mỗi case đủ mọi field, steps 1500–3500 ký tự có nhánh "nếu khách làm X thì…", 2–3 tin nhắn mẫu:
- (payment) Hợp đồng hourly: khách tranh chấp 12 giờ của tuần trước, trong đó 3 giờ là manual time.
- (payment) Khách hết ngân sách giữa chừng, đề nghị trả một nửa milestone, phần còn lại "tháng sau".
- (contract) Scope creep trên fixed-price: khách liên tục thêm "chỉ một chỉnh sửa nhỏ", tổng cộng đã gấp đôi phạm vi.
- (contract) Khách đòi làm "test task" không trả tiền 8 giờ trước khi thuê.
- (contract) Bạn ước lượng sai: milestone fixed-price đã tốn gấp đôi thời gian dự kiến, còn 40% việc.
- (contract) Khách yêu cầu dùng tài khoản cloud/API key cá nhân của bạn (chi phí do bạn trả), hoặc ký NDA/hợp đồng IP ngoài Upwork có điều khoản bất lợi.

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
Đã thêm 6 case vào `js/data/upwork-cases-1.js` (chèn trước `);` cuối file, chỉ THÊM, không sửa case 001):
- uw-case-002 (payment): tranh chấp 12 giờ hourly, 3 giờ manual time.
- uw-case-003 (payment): khách hết ngân sách, đòi trả nửa milestone, phần còn lại "tháng sau".
- uw-case-004 (contract): scope creep fixed-price, "chỉnh sửa nhỏ" cộng lại gấp đôi phạm vi.
- uw-case-005 (contract): khách đòi "test task" 8 giờ không trả tiền trước khi thuê.
- uw-case-006 (contract): ước lượng sai, milestone fixed-price tốn gấp đôi giờ, còn 40% việc.
- uw-case-007 (contract): khách đòi dùng AWS/API key cá nhân + NDA/IP ngoài Upwork bất lợi.
Mỗi case đủ field, steps có nhánh "nếu khách làm X thì…", 2–3 tin nhắn mẫu tiếng Anh.
Kiểm tra: `node --check` OK; `node scripts/check-upwork.js` → OK (7 case); `node scripts/validate.js` không có lỗi nào thuộc file này (các lỗi còn lại thuộc quiz-ops.js, lessons-*.js — không sở hữu, không sửa theo luật 3).
Reviewed-by: verify-only (code/UI task)
