# T2819 — 6 câu hỏi nghiệp vụ phái sinh hàng hoá cho dev Java

Status: DONE
Agent: kilo
Owns: `js/data/q-banking.js`
After: T2812

Đã thêm 6 câu hỏi topic `banking` (banking-110..115), tag `'phai-sinh'` + `'jd-2026-12'`, không trùng T2812:
- banking-110 (mid): hợp đồng tương lai vs spot, contract spec (multiplier/tick size/tháng đáo hạn) → data model + tính tiền.
- banking-111 (senior): mark-to-market + variation margin, ví dụ 3 ngày, batch EOD idempotent/replay/đối soát.
- banking-112 (lead): initial/maintenance margin, margin call, tất toán bắt buộc, concurrency nạp tiền vs tất toán (single-writer).
- banking-113 (senior): vị thế mở, open interest vs volume, đóng đối ứng, FIFO vs bình quân.
- banking-114 (senior): ngày giao dịch cuối, rollover, physical vs cash settlement, chặn/nhắc.
- banking-115 (senior): liên thông sàn quốc tế, lệch múi giờ/phiên/ngày nghỉ, tỷ giá USD/VND, trading calendar.

Kiểm tra: `node --check js/data/q-banking.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` không có lỗi/cảnh báo nào thuộc q-banking.js (các lỗi còn lại thuộc file khác: toeic-*, quiz-ops, lessons-*, q-frontend — ngoài phạm vi task). Không commit.

Thêm **6 câu hỏi** topic `banking` vào `js/data/q-banking.js` (đọc các câu T2812 vừa thêm để KHÔNG trùng), tag `'phai-sinh'` và `'jd-2026-12'`.

Bối cảnh: người học là dev Java 5 năm (Spring Boot, tối ưu query, review code), muốn vào sàn giao dịch **phái sinh hàng hoá** (kiểu Sở Giao dịch Hàng hóa Việt Nam – MXV: hợp đồng tương lai nông sản, kim loại, năng lượng liên thông sàn quốc tế). JD mục tiêu: module giao dịch, khớp lệnh, tài khoản/ký quỹ, nạp rút, market data real-time (WebSocket, FIX, Kafka), độ trễ thấp, tối ưu GC/CPU/query/cache (Redis, Hazelcast), distributed transaction, concurrency, deadlock, data consistency; Java 17/21, Spring Boot. Dự án phải giúp họ **kể được trong phỏng vấn** và **chạy được trên laptop** (Docker Compose).

Câu cần có:
1. Hợp đồng tương lai hàng hoá là gì, khác giao ngay (spot) thế nào; contract spec (multiplier, tick size, tháng đáo hạn) ảnh hưởng gì tới data model và tính tiền. (mid)
2. Mark-to-market hằng ngày và variation margin: tính tay ví dụ 3 ngày, batch EOD cần đảm bảo gì (idempotent, chạy lại được, đối soát). (senior)
3. Ký quỹ ban đầu/duy trì, margin call và tất toán bắt buộc: thiết kế luồng và xử lý đồng thời khi khách vừa nạp tiền vừa bị tất toán. (lead)
4. Vị thế mở, open interest, đóng vị thế đối ứng; position keeping theo FIFO vs bình quân: chọn gì, ảnh hưởng báo cáo lãi lỗ. (senior)
5. Ngày giao dịch cuối, rollover và tất toán vật chất vs tiền mặt: hệ thống phải chặn/nhắc gì, lỗi production hay gặp. (senior)
6. Liên thông sàn quốc tế: lệch múi giờ, phiên giao dịch, ngày nghỉ khác nhau, tỷ giá USD/VND khi tính ký quỹ; thiết kế lịch giao dịch (trading calendar). (senior)

Mỗi câu theo AGENTS.md mục 4 và 6 (Tóm tắt → cơ chế VÌ SAO → code Java ≤ 30 dòng hoặc ~~~seq → bảng trade-off → pitfall → Ví dụ đời thực có số → Trả lời mẫu 150–220 từ → > Senior tip:), follow 2–3 câu.

## Luật
- Đọc AGENTS.md (mục 4–6). Id nối tiếp (`node scripts/qtool.js list js/data/q-banking.js`). **Tiếng Việt CÓ DẤU.** Chỉ THÊM, không sửa mục khác/file khác. Không backtick, không `${`.
- Số liệu sàn thật (CBOT, ICE, MXV) chỉ ghi khi chắc chắn, kèm "(tham khảo)". Không chắc thì dùng ví dụ giả định ghi rõ là giả định.

## Nghiệm thu
`node --check js/data/q-banking.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → không có lỗi thuộc file của bạn. KHÔNG commit.
Xong: `Status: DONE` + Notes ghi id.

## Notes
- ID đã thêm: banking-110, banking-111, banking-112, banking-113, banking-114, banking-115.
- Tất cả tag `'phai-sinh'` + `'jd-2026-12'`; tuân thủ markup (không backtick, không `${`), độ dài đáp án ≥ 1500 ký tự.
- `node scripts/validate.js`: q-banking.js sạch (không lỗi/cảnh báo). Các lỗi còn lại thuộc file ngoài phạm vi (toeic-*, quiz-ops, lessons-*, q-frontend).
Reviewed-by: kilo (T2819R)
