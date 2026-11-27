# T2808 — Case khó Upwork: khách hàng, review và tài khoản, vòng 2 (6 case)

Status: DONE
Agent: kilo
Owns: `js/data/upwork-cases-2.js`
After: T2805

Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.
**Đọc mọi chương/case đã có trong các file upwork-*.js để KHÔNG trùng ý.**

Thêm **6 case** `uw-case-107`…`uw-case-112` vào `js/data/upwork-cases-2.js` (dải id của file này: 101–199). Mỗi case đủ mọi field, steps 1500–3500 ký tự có nhánh "nếu khách làm X thì…", 2–3 tin nhắn mẫu:
- (client) Khách không rành kỹ thuật, đổi ý mỗi tuần và đổ lỗi cho bạn khi kết quả không như mong đợi.
- (client) Khách gửi mật khẩu production/DB có dữ liệu khách hàng thật qua chat: xử lý an toàn, bảo mật dữ liệu.
- (client) Code cũ của khách rất tệ; khách đòi sửa nhanh trong ngân sách nhỏ và hứa "refactor sau".
- (review) Hợp đồng dài hạn kết thúc êm nhưng khách không để feedback; nhiều hợp đồng nhỏ không hoạt động lâu: tác động và cách đóng chủ động.
- (review) Khách đề nghị "5 sao nếu giảm giá" hoặc đòi bạn để review tốt cho họ trước.
- (account) Bạn ốm/việc gia đình phải nghỉ 2 tuần giữa 3 hợp đồng đang chạy: thông báo, bàn giao, giữ uy tín.

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
Đã thêm 6 case vào `js/data/upwork-cases-2.js` (dải 101–199):
- `uw-case-107` (client) Khách không rành kỹ thuật, đổi ý mỗi tuần, đổ lỗi — spec/wireframe/demo/change-request.
- `uw-case-108` (client) Khách gửi mật khẩu production + DB PII qua chat — read-only user, masked data, GDPR, không commit secret.
- `uw-case-109` (client) Code cũ tệ, đòi sửa nhanh ngân sách nhỏ, hứa "refactor sau" — hotfix an toàn + báo cáo nợ kỹ thuật + refactor milestone riêng.
- `uw-case-110` (review) Hợp đồng dài hạn kết thúc êm nhưng không có feedback; nhiều job ngắn — wrap-up + xin review đúng cách, đóng hợp đồng, khách lặp lại.
- `uw-case-111` (review) "5 sao nếu giảm giá" / trao đổi review — từ chối review có điều kiện, giữ giá, mời review tự nguyện.
- `uw-case-112` (account) Ốm/việc gia đình nghỉ 2 tuần giữa 3 hợp đồng — thông báo sớm, handover note, gia hạn review, bus factor.

Kiểm tra: `node --check` OK; `node scripts/check-upwork.js` → OK (37 case); `node scripts/validate.js` không có lỗi thuộc file này (các lỗi còn lại thuộc quiz-ops.js, lessons-*.js của task khác).
Reviewed-by: verify-only (code/UI task)
