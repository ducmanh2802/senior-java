# T2828 — 2 bài học + bài tập tự chấm: order book khớp lệnh và mark-to-market/ký quỹ

Status: DONE
Agent: kilo
Owns: `js/data/lessons-banking.js`

Thêm **2 bài học** track `banking` (lesson-banking-027, 028) theo AGENTS.md mục 12; đọc kỹ bài mẫu `lesson-collections-001` và vài bài banking có sẵn.

Bối cảnh: người học là dev Java 5 năm chuẩn bị phỏng vấn sàn **phái sinh hàng hoá** (kiểu MXV: hợp đồng tương lai nông sản, kim loại, năng lượng liên thông sàn quốc tế). JD: khớp lệnh, ký quỹ (margin), nạp rút, market data real-time (WebSocket, FIX, Kafka), độ trễ thấp, concurrency, deadlock, data consistency; Java 17/21, Spring Boot. Pet project liên quan: proj-commodity-exchange, proj-clearing-margin, proj-deriv-risk (có thể chưa có trong projects.js).

1. **Order book giá–thời gian và matching engine** (senior, ~40 phút): TreeMap theo giá + ArrayDeque FIFO mỗi mức giá, lệnh limit/market/IOC/FOK, khớp một phần, huỷ lệnh, vì sao single-threaded. Bài tập: `OrderBook.submit/cancel` trả danh sách trade; test ưu tiên giá, ưu tiên thời gian, khớp một phần, IOC huỷ phần dư, FOK không đủ thì không khớp gì, huỷ lệnh đã khớp một phần.
2. **Mark-to-market hằng ngày, variation margin và margin call** (senior, ~35 phút): multiplier, settlement price, lãi lỗ theo ngày, số dư ký quỹ, ngưỡng duy trì, gọi ký quỹ, tất toán bắt buộc; BigDecimal + làm tròn. Bài tập: `MarginEngine.settle(positions, prices)` trả variation margin + danh sách tài khoản bị margin call; test vị thế long/short, nhiều ngày liên tiếp, đúng ngưỡng (biên), chạy lại cùng ngày idempotent.

Code chỉ JDK chuẩn, biên dịch với Java 17, test deterministic. Chạy thêm `node scripts/test-lessons.js` (reference pass 100%, starter biên dịch được và không pass hết).

## Luật
- Đọc AGENTS.md trước (mục liên quan tới loại dữ liệu bên dưới). **Tiếng Việt CÓ DẤU đầy đủ.** Không backtick, không `${` trong template literal.
- **Chỉ THÊM** vào `js/data/lessons-banking.js` (chèn trước dấu đóng mảng cuối file); không sửa mục đã có, không sửa file khác. Id nối tiếp id lớn nhất hiện có.
- Kiến thức đúng; số liệu sàn thật (CBOT, ICE, MXV) chỉ ghi khi chắc chắn, kèm "(tham khảo)"; không chắc thì ghi rõ là ví dụ giả định.

## Nghiệm thu
`node --check js/data/lessons-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit, không mở trình duyệt.
Xong: sửa dòng `Status:` thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài học vào `js/data/lessons-banking.js` (chèn trước dấu đóng mảng cuối file):
  - `lesson-banking-027` (order 27, senior, 40 phút): order book giá–thời gian + matching engine (TreeMap + ArrayDeque, limit/market/IOC/FOK, khớp một phần, huỷ lệnh, single-threaded). Bài tập `OrderBook.submit/cancel` — 8 test (uu_tien_gia, uu_tien_thoi_gian, khop_mot_phan, ioc_huy_phan_du, fok_khong_du, fok_du_thi_khop_het, huy_lenh_mot_phan, market_khong_rest).
  - `lesson-banking-028` (order 28, senior, 35 phút): mark-to-market, variation margin, margin call (long/short, multiplier, settlement price, ngưỡng duy trì, idempotent theo ngày, dùng long chính xác). Bài tập `MarginEngine.settle` — 8 test (long_loi, short_loi, short_lo_margin_call, dung_nguong_khong_goi, duoi_nguong_mot_don_vi, idempotent_cung_ngay, nhieu_ngay_cong_don, nhieu_tai_khoan).
- `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` không có lỗi thuộc file này (các lỗi còn lại là của file khác, có sẵn từ trước).
- `node scripts/test-lessons.js lesson-banking-027` và `...028`: reference pass 8/8, starter biên dịch được và không pass hết.
- Không commit, không mở trình duyệt, không npm install.
Reviewed-by: kilo (T2828R)
Verify-failed: 2026-11-27 23:20:58
