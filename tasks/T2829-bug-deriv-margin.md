# T2829 — 2 bug production sàn phái sinh: race ký quỹ khi tất toán và order book sai ưu tiên

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`

Thêm **2 bài** `bug-053`, `bug-054` vào `js/data/bugs.js` theo AGENTS.md mục 17; đọc kỹ bài mẫu `bug-001`.

Bối cảnh: người học là dev Java 5 năm chuẩn bị phỏng vấn sàn **phái sinh hàng hoá** (kiểu MXV: hợp đồng tương lai nông sản, kim loại, năng lượng liên thông sàn quốc tế). JD: khớp lệnh, ký quỹ (margin), nạp rút, market data real-time (WebSocket, FIX, Kafka), độ trễ thấp, concurrency, deadlock, data consistency; Java 17/21, Spring Boot. Pet project liên quan: proj-commodity-exchange, proj-clearing-margin, proj-deriv-risk (có thể chưa có trong projects.js).

1. **bug-053 (P1, lead)**: khách nạp tiền đúng lúc job tất toán bắt buộc chạy → số dư ký quỹ bị ghi đè (lost update, read-modify-write không khoá, không version) và vị thế vẫn bị tất toán dù đã đủ tiền. Artifact: log job + log nạp tiền có timestamp chồng nhau, bảng số dư trước/sau. Test tái hiện xác định bằng CountDownLatch/CyclicBarrier. Fix: optimistic locking (version) + retry, hoặc khoá theo tài khoản; kiểm lại điều kiện margin ngay trước khi tất toán.
2. **bug-054 (P2, senior)**: sửa lệnh (amend tăng khối lượng) giữ nguyên ưu tiên thời gian → vi phạm price-time priority, khách khác khiếu nại bị khớp sau. Artifact: FIX log rút gọn (OrderCancelReplaceRequest, ExecutionReport), audit trail lệnh. Fix: tăng khối lượng hoặc đổi giá = mất ưu tiên (xếp cuối hàng), giảm khối lượng giữ ưu tiên.

Chạy `node scripts/test-bugs.js`: reference pass hết (≥ 3 test), starter biên dịch được và không pass hết.

## Luật
- Đọc AGENTS.md trước (mục liên quan tới loại dữ liệu bên dưới). **Tiếng Việt CÓ DẤU đầy đủ.** Không backtick, không `${` trong template literal.
- **Chỉ THÊM** vào `js/data/bugs.js` (chèn trước dấu đóng mảng cuối file); không sửa mục đã có, không sửa file khác. Id nối tiếp id lớn nhất hiện có.
- Kiến thức đúng; số liệu sàn thật (CBOT, ICE, MXV) chỉ ghi khi chắc chắn, kèm "(tham khảo)"; không chắc thì ghi rõ là ví dụ giả định.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

## Notes
Added bug-053, bug-054.
Reviewed-by: verify-only (code/UI task)
