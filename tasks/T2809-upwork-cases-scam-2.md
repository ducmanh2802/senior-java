# T2809 — Case khó Upwork: lừa đảo và proposal, vòng 2 (6 case)

Status: DONE
Agent: kilo
Owns: `js/data/upwork-cases-3.js`
After: T2806

Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.
**Đọc mọi chương/case đã có trong các file upwork-*.js để KHÔNG trùng ý.**

Thêm **6 case** `uw-case-207`…`uw-case-212` vào `js/data/upwork-cases-3.js` (dải id của file này: 201–299). Mỗi case đủ mọi field, steps 1500–3500 ký tự có nhánh "nếu khách làm X thì…", 2–3 tin nhắn mẫu:
- (scam) Khách mạo danh công ty lớn (tên miền email gần giống thật), yêu cầu điền form "onboarding" có số CCCD, ảnh mặt, tài khoản ngân hàng.
- (scam) Khách nhờ cài phần mềm điều khiển từ xa/extension "để theo dõi giờ làm" hoặc đăng nhập tài khoản của họ trên máy bạn.
- (scam) Job có dấu hiệu vi phạm pháp luật hoặc điều khoản nền tảng (viết review giả, bypass bảo vệ, clone app có bản quyền): nhận diện và từ chối.
- (proposal) Được mời (invite) vào job ngân sách quá thấp so với phạm vi: trả lời thế nào để giữ quan hệ mà không bán rẻ.
- (proposal) Khách hỏi "làm được trong 3 ngày không" với việc cần 2 tuần: ước lượng trung thực, đưa phương án cắt phạm vi.
- (proposal) Hai khách cùng muốn thuê một lúc, tổng việc vượt năng lực: chọn ai, từ chối/hoãn chuyên nghiệp.

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
Đã thêm uw-case-207…uw-case-212 vào js/data/upwork-cases-3.js.
Reviewed-by: verify-only (code/UI task)
