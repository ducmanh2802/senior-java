# T2810 — Cẩm nang Upwork: chương 10–12

Status: TODO
Agent: kilo
Owns: `js/data/upwork-guide-2.js`

Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide-2.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.
**Đọc mọi chương/case đã có trong các file upwork-*.js để KHÔNG trùng ý.**

Thêm **3 chương** `uw-ch-10`…`uw-ch-12` (order 10–12; file mới, push vào cùng window.UPWORK_GUIDE), mỗi body 3500–6000 ký tự:
10. **Tiếng Anh làm việc với khách**: mẫu câu kickoff, báo tiến độ, báo trễ hạn, từ chối yêu cầu, hỏi lại khi chưa rõ, nhận lỗi; lỗi diễn đạt người Việt hay mắc (quá thẳng hoặc xin lỗi quá mức); viết tin nhắn async rõ ràng. Mẫu câu đặt trong ~~~text.
11. **Dùng AI khi làm freelance mà không mất uy tín**: dùng AI để code/viết proposal nhưng tự review; không dán code, secret, dữ liệu của khách vào công cụ AI khi chưa được phép; minh bạch với khách; chính sách của Upwork về nội dung AI chỉ nêu ở mức nguyên tắc.
12. **Kế hoạch 30 ngày đầu trên Upwork**: lịch từng tuần (hồ sơ → proposal mỗi ngày → hợp đồng nhỏ đầu tiên → review đầu tiên), chỉ số cần theo dõi, khi nào điều chỉnh giá/ngách.

## Luật
- Đọc AGENTS.md (mục 5–6). **Tiếng Việt CÓ DẤU đầy đủ**; tin nhắn mẫu gửi khách bằng tiếng Anh tự nhiên.
- **Chỉ THÊM** vào file sở hữu (chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác.
- Không backtick, không `${` trong template literal. Trong `templates[].text` dùng chuỗi nháy đơn, xuống dòng bằng \n.
- **Đúng sự thật về Upwork**: phí, giá Connects, ngưỡng badge/JSS, số ngày của các mốc thay đổi theo thời gian — chỉ ghi con số khi chắc chắn, kèm "(tại thời điểm viết, kiểm tra lại trên Upwork Help)". Không chắc thì mô tả cơ chế. Không bịa tên tính năng/nút bấm. Thuế/pháp lý Việt Nam: chỉ nêu nguyên tắc và khuyên hỏi chuyên gia, không ghi thuế suất.
- Người đọc: dev Java ~4 năm ở Việt Nam, mới làm freelance: giải thích thuật ngữ ở lần đầu (escrow, JSS, Connects…), ví dụ cụ thể có số tiền, ngày, tin nhắn.

## Nghiệm thu
`node --check js/data/upwork-guide-2.js`; `node scripts/check-upwork.js` → `OK — dữ liệu Upwork hợp lệ.`; `node scripts/validate.js` không có lỗi nào thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
