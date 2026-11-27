# T2832 — Bài system design: ký quỹ và quản lý rủi ro real-time cho sàn phái sinh

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`

Thêm **1 bài** `sd-067` vào `js/data/sd-problems.js`; đọc schema và bài "Hệ thống đặt lệnh và khớp lệnh chứng khoán" có sẵn để **không trùng** (bài này tập trung hậu giao dịch: clearing, margin, risk).

Bối cảnh: người học là dev Java 5 năm chuẩn bị phỏng vấn sàn **phái sinh hàng hoá** (kiểu MXV: hợp đồng tương lai nông sản, kim loại, năng lượng liên thông sàn quốc tế). JD: khớp lệnh, ký quỹ (margin), nạp rút, market data real-time (WebSocket, FIX, Kafka), độ trễ thấp, concurrency, deadlock, data consistency; Java 17/21, Spring Boot. Pet project liên quan: proj-commodity-exchange, proj-clearing-margin, proj-deriv-risk (có thể chưa có trong projects.js).

Đề: nhận trade từ matching engine, cập nhật vị thế, tính lãi lỗ tạm tính theo tick cho 200.000 tài khoản, gọi ký quỹ trong < 1 giây khi giá biến động, tất toán bắt buộc, EOD settlement, đối soát. Cần: yêu cầu chức năng/phi chức năng có số, ước lượng tải, kiến trúc (Kafka partition theo account, in-memory state + snapshot, Redis/Hazelcast), data model, ~~~seq luồng margin call, nhất quán khi nạp tiền đồng thời, xử lý lỗi/replay, trade-off, câu hỏi đào sâu.

## Luật
- Đọc AGENTS.md trước (mục liên quan tới loại dữ liệu bên dưới). **Tiếng Việt CÓ DẤU đầy đủ.** Không backtick, không `${` trong template literal.
- **Chỉ THÊM** vào `js/data/sd-problems.js` (chèn trước dấu đóng mảng cuối file); không sửa mục đã có, không sửa file khác. Id nối tiếp id lớn nhất hiện có.
- Kiến thức đúng; số liệu sàn thật (CBOT, ICE, MXV) chỉ ghi khi chắc chắn, kèm "(tham khảo)"; không chắc thì ghi rõ là ví dụ giả định.

## Nghiệm thu
`node --check js/data/sd-problems.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Entry sd-067 added to js/data/sd-problems.js (kind: bank, level: lead) — ký quỹ & quản lý rủi ro real-time cho sàn phái sinh hàng hoá: nhận fill từ matching engine, vị thế in-memory + snapshot + ledger append-only, mark-to-market theo tick (incremental), margin call < 1s (partition theo contract cho giá, theo account cho tiền/margin), single-writer theo account để nạp tiền không race, tất toán bắt buộc, EOD settlement idempotent + đối soát. Có ~~~seq luồng margin call, bảng failure modes, ví dụ đời thực, trả lời mẫu, 5 followups. node --check OK; build-light-index + validate: không có lỗi thuộc sd-problems.js (các lỗi còn lại thuộc file khác).
Reviewed-by: kilo (T2832R)
