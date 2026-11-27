# T2806 — Case khó Upwork: lừa đảo và proposal (6 case)

Status: DONE
Agent: kilo
Owns: `js/data/upwork-cases-3.js`


Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.

Thêm **6 case** `uw-case-201`…`uw-case-206` vào `js/data/upwork-cases-3.js` (dải id của file này: 201–299). Mỗi case đủ mọi field, steps 1500–3500 ký tự có nhánh "nếu khách làm X thì…", 2–3 tin nhắn mẫu:
- (scam) Khách lạ mời phỏng vấn, đòi chuyển sang Telegram/WhatsApp ngay, rồi gửi "check" để mua thiết bị.
- (scam) "Bài test kỹ thuật": khách gửi repo bảo chạy npm install / chạy file để tái hiện bug — mã độc đánh cắp ví, cookie, SSH key. Cách kiểm tra an toàn (đọc package.json scripts, chạy trong VM/container không có secret), báo cáo.
- (scam) Đề nghị "thuê tài khoản Upwork" của bạn hoặc nhờ bạn đứng tên nhận tiền hộ, chia phần trăm.
- (proposal) Gửi 30 proposal, 0 phản hồi: chẩn đoán phễu bằng số liệu (tỷ lệ được xem, mời phỏng vấn) và sửa từng khâu.
- (proposal) Khách mời phỏng vấn nhưng ép giá xuống 50% vì có người rẻ hơn: đàm phán, giảm phạm vi thay vì giảm giá, khi nào rút lui.
- (proposal) Job cần kỹ năng bạn chỉ có khoảng 60% (Java mạnh nhưng React/Next.js yếu): có nên ứng tuyển, nói trung thực thế nào, chia phạm vi.

## Luật
- Đọc AGENTS.md (mục 5–6). **Tiếng Việt CÓ DẤU đầy đủ**; tin nhắn mẫu gửi khách bằng tiếng Anh tự nhiên.
- **Chỉ THÊM** vào file sở hữu (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác.
- Không backtick, không `${` trong template literal. Trong `templates[].text` dùng chuỗi nháy đơn, xuống dòng bằng \n.
- **Đúng sự thật về Upwork**: phí, giá Connects, ngưỡng badge/JSS, số ngày của các mốc thay đổi theo thời gian — chỉ ghi con số khi chắc chắn, kèm "(tại thời điểm viết, kiểm tra lại trên Upwork Help)". Không chắc thì mô tả cơ chế. Không bịa tên tính năng/nút bấm. Thuế/pháp lý Việt Nam: chỉ nêu nguyên tắc và khuyên hỏi chuyên gia, không ghi thuế suất.
- Người đọc: dev Java ~4 năm ở Việt Nam, mới làm freelance: giải thích thuật ngữ ở lần đầu (escrow, JSS, Connects…), ví dụ cụ thể có số tiền, ngày, tin nhắn.

## Nghiệm thu
`node --check js/data/upwork-cases-3.js`; `node scripts/check-upwork.js` → `OK — dữ liệu Upwork hợp lệ.`; `node scripts/validate.js` không có lỗi nào thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 case uw-case-201…uw-case-206 vào js/data/upwork-cases-3.js. check-upwork OK.
Reviewed-by: verify-only (code/UI task)
