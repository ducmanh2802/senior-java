# T2802 — Cẩm nang Upwork: chương 2–5

Status: DONE
Agent: kilo
Owns: `js/data/upwork-guide.js`


Phần **Freelance & Upwork** (`#/upwork`). Đọc kỹ **docs/UPWORK-GUIDE.md** (schema + luật nội dung) và mẫu có sẵn:
chương `uw-ch-01` trong `js/data/upwork-guide.js`, case `uw-case-001` trong `js/data/upwork-cases-1.js`. Viết cùng độ sâu và giọng văn.
Đọc danh sách câu hỏi topic `remote` (`node scripts/qtool.js list js/data/q-remote.js`) để **không chép lại**; trỏ tới câu liên quan qua `related`.

Thêm **4 chương** `uw-ch-02`…`uw-ch-05` (order 2–5), mỗi body 3500–6000 ký tự, có bảng, ví dụ số liệu, ít nhất 1 chương có ~~~seq:
2. **Hồ sơ đạt chuẩn cho dev Java**: title, overview (cấu trúc đoạn mở đầu), portfolio khi chưa có khách, chọn hourly rate khởi điểm và lộ trình tăng giá, xác minh danh tính, lý do profile bị từ chối và cách sửa.
3. **Tìm job và viết proposal**: lọc job, đọc tín hiệu về khách (payment verified, số tiền đã chi, tỷ lệ thuê, review khách nhận từ freelancer khác), cách dùng Connects có tính toán, cấu trúc proposal 5 phần, trả lời câu hỏi sàng lọc, theo dõi phễu (gửi → được xem → phỏng vấn → thuê).
4. **Phỏng vấn và chốt hợp đồng**: chuẩn bị cuộc gọi, câu hỏi cần hỏi khách, chọn hourly hay fixed-price, viết milestone kiểm chứng được (tiêu chí nghiệm thu, ngoài phạm vi), đọc offer trước khi chấp nhận, những điều kiện phải từ chối.
5. **Thực hiện hợp đồng**: kickoff, nhịp báo cáo (daily/weekly update mẫu), Work Diary và memo, quản lý thay đổi (change request → milestone mới), bàn giao chuẩn (submit work, tài liệu, video demo), đóng hợp đồng và xin feedback.

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
Đã thêm 4 chương: uw-ch-02 (Hồ sơ đạt chuẩn), uw-ch-03 (Tìm job và viết proposal), uw-ch-04 (Phỏng vấn và chốt hợp đồng), uw-ch-05 (Thực hiện hợp đồng). Chương uw-ch-03 có sơ đồ ~~~seq cho phễu proposal. Tất cả validation pass.
Reviewed-by: verify-only (code/UI task)
