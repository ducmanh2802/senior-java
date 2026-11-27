# T2803 — Cẩm nang Upwork: chương 6–9

Status: DONE
Agent: kilo
Owns: `js/data/upwork-guide.js`
After: T2802

Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.

Thêm **4 chương** `uw-ch-06`…`uw-ch-09` (order 6–9), mỗi body 3500–6000 ký tự:
6. **Tiền**: tính tiền thực nhận (phí dịch vụ, phí rút, tỷ giá) với ví dụ số, các phương thức rút về Việt Nam ở mức cơ chế, security period, quỹ dự phòng 3–6 tháng, nguyên tắc thuế (không ghi thuế suất, khuyên hỏi chuyên gia).
7. **Review, Job Success Score và badge**: feedback công khai và private feedback, cơ chế JSS ở mức nguyên lý, những hợp đồng làm JSS giảm (kể cả hợp đồng không hoạt động lâu), cách đóng hợp đồng chủ động, phản hồi review xấu công khai.
8. **Tranh chấp và an toàn tài khoản**: quy trình hourly dispute, fixed-price refund/dispute, mediation, arbitration, điều khoản dễ vi phạm (circumvention, chia sẻ tài khoản, VPN/đăng nhập bất thường), tài khoản bị khoá và cách kháng nghị, lưu bằng chứng.
9. **Phát triển dài hạn**: biến khách một lần thành khách dài hạn, tăng giá với khách cũ (mẫu tin nhắn), chuyên môn hoá ngách, hợp đồng retainer, khi nào mở rộng ra ngoài Upwork mà không vi phạm điều khoản.

## Luật
- Đọc AGENTS.md (mục 5–6). **Tiếng Việt CÓ DẤU đầy đủ**; tin nhắn mẫu gửi khách bằng tiếng Anh tự nhiên.
- **Chỉ THÊM** vào file sở hữu (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác.
- Không backtick, không `${` trong template literal. Trong `templates[].text` dùng chuỗi nháy đơn, xuống dòng bằng \n.
- **Đúng sự thật về Upwork**: phí, giá Connects, ngưỡng badge/JSS, số ngày của các mốc thay đổi theo thời gian — chỉ ghi con số khi chắc chắn, kèm "(tại thời điểm viết, kiểm tra lại trên Upwork Help)". Không chắc thì mô tả cơ chế. Không bịa tên tính năng/nút bấm. Thuế/pháp lý Việt Nam: chỉ nêu nguyên tắc và khuyên hỏi chuyên gia, không ghi thuế suất.
- Người đọc: dev Java ~4 năm ở Việt Nam, mới làm freelance: giải thích thuật ngữ ở lần đầu (escrow, JSS, Connects…), ví dụ cụ thể có số tiền, ngày, tin nhắn.

## Nghiệm thu
`node --check js/data/upwork-guide.js`; `node scripts/check-upwork.js` → `OK — dữ liệu Upwork hợp lệ.`; `node scripts/validate.js` không có lỗi nào thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: verify-only (code/UI task)
