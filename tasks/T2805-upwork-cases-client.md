# T2805 — Case khó Upwork: khách hàng, review và tài khoản (6 case)

Status: DONE
Agent: kilo
Owns: `js/data/upwork-cases-2.js`


Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.

Thêm **6 case** `uw-case-101`…`uw-case-106` vào `js/data/upwork-cases-2.js` (dải id của file này: 101–199). Mỗi case đủ mọi field, steps 1500–3500 ký tự có nhánh "nếu khách làm X thì…", 2–3 tin nhắn mẫu:
- (client) Khách biến mất giữa hợp đồng (không trả lời 2 tuần), milestone đang funded và đã có phần làm dở.
- (client) Khách nhắn liên tục ngoài giờ theo giờ Mỹ, thái độ xúc phạm; bạn muốn kết thúc hợp đồng mà hạn chế rủi ro review xấu.
- (client) Bạn gây sự cố production cho khách (deploy lỗi làm mất đơn hàng 3 giờ): nhận trách nhiệm, khắc phục, postmortem, có nên hoàn tiền một phần.
- (review) Nhận review 3 sao kèm nhận xét không công bằng, JSS giảm: phản hồi công khai và kế hoạch phục hồi.
- (account) Tài khoản bị tạm khoá do xác minh danh tính / đăng nhập bất thường (VPN, máy mới, đi công tác): xử lý và kháng nghị.
- (account) Profile bị từ chối duyệt hoặc không ai xem proposal sau 1 tháng: chẩn đoán và sửa.

## Luật
- Đọc AGENTS.md (mục 5–6). **Tiếng Việt CÓ DẤU đầy đủ**; tin nhắn mẫu gửi khách bằng tiếng Anh tự nhiên.
- **Chỉ THÊM** vào file sở hữu (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác.
- Không backtick, không `${` trong template literal. Trong `templates[].text` dùng chuỗi nháy đơn, xuống dòng bằng \n.
- **Đúng sự thật về Upwork**: phí, giá Connects, ngưỡng badge/JSS, số ngày của các mốc thay đổi theo thời gian — chỉ ghi con số khi chắc chắn, kèm "(tại thời điểm viết, kiểm tra lại trên Upwork Help)". Không chắc thì mô tả cơ chế. Không bịa tên tính năng/nút bấm. Thuế/pháp lý Việt Nam: chỉ nêu nguyên tắc và khuyên hỏi chuyên gia, không ghi thuế suất.
- Người đọc: dev Java ~4 năm ở Việt Nam, mới làm freelance: giải thích thuật ngữ ở lần đầu (escrow, JSS, Connects…), ví dụ cụ thể có số tiền, ngày, tin nhắn.

## Nghiệm thu
`node --check js/data/upwork-cases-2.js`; `node scripts/check-upwork.js` → `OK — dữ liệu Upwork hợp lệ.`; `node scripts/validate.js` không có lỗi nào thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm uw-case-101..106 vào js/data/upwork-cases-2.js. check-upwork OK, validate không có lỗi thuộc file.
Reviewed-by: verify-only (code/UI task)
