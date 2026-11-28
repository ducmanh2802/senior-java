# T2897 — System design: 2 đề mới vào sd-problems.js

Status: DONE
Agent: kilo
Owns: `js/data/sd-problems.js`
After: T2885

Thêm **2 đề system design mới** vào `js/data/sd-problems.js` (id `sd-NNN` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn** và giữ đúng schema (id, title, kind, level, prompt, phases, rubric, reference, followups, related) cùng độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive điểm khó, trade-off, sự cố hay gặp. Đọc danh sách tiêu đề đề cũ để **không trùng**.

Đề: (1) **Chấm công cho 20.000 công nhân nhà máy**: máy chấm công gửi dữ liệu offline/online, tính công theo ca, ca đêm qua ngày, khiếu nại. (2) **QR thanh toán cho merchant (VietQR)**: sinh QR tĩnh/động, nhận thông báo biến động số dư, khớp đơn, xử lý chuyển thiếu/thừa.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/sd-problems.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 đề mới vào js/data/sd-problems.js (id nối tiếp sau sd-068):
  - sd-069: Chấm công đa khu nhà máy (ca xoay chuyển, làm thêm OT, tích hợp bảng lương, geofence/selfie chống chấm hộ) — level lead, kind enterprise. Góc khác sd-059 (đơn khu, 5 ca): đa khu + roster hiệu lực theo ngày + OT theo luật lao động + xuất bảng lương immutable.
  - sd-070: QR thanh toán merchant đa nhà cung cấp (VietQR/Napas/ví): QR tĩnh/động EMVCo, webhook HMAC idempotent theo bank_txn_id, khớp MATCHED/PARTIAL/OVERPAID/UNMATCHED/AMBIGUOUS, hoàn tiền idempotent, soát đối cuối ngày với sao kê từng ngân hàng — level lead, kind enterprise. Góc khác sd-060 (đơn ngân hàng): đa ngân hàng/PSP + hoàn tiền + soát đối ngân hàng.
- validate.js: exit 0, không lỗi sd-problems.js. build-light-index.js: OK. node --check: OK.
Reviewed-by: kilo (T2897R)
