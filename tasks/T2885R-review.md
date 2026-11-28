# T2885R — Fact-check nội dung mới của T2885

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2885 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 2 mục mới của T2885 (sd-053, sd-054). Các lỗi đã sửa:

- **sd-053**:
  - Sơ đồ `~~~seq` hỏng hoàn toàn: 7 actor (giới hạn 2–6) + các dòng không hợp lệ `... (ngày sau) ...`, `Kafka --> Revenue share worker: ...`, `Kafka --> Anti-fraud: ...`, `Revenue share worker: ...` (parseSeq ném lỗi). Đã viết lại còn 6 actor (Siêu thị POS | API Gateway | Coalition Service | Ledger DB | Kafka | Nhà hàng App), chuyển các bước phụ thành `note` hợp lệ.
  - Số liệu mâu thuẫn: Estimation ghi "100M x 300 byte = 30 GB/ngày" nhưng reference ghi "300M ledger rows/ngày ~ 30 GB". Đã sửa reference thành "~300M balance updates/ngày; ledger ~100M rows ~ 30 GB/ngày thô" cho nhất quán với 30 GB và 11 TB/năm.
- **sd-054**:
  - Lẫn ký tự nước ngoài: `審批` (Trung) trong prompt → "approve (phê duyệt)"; `조사` (Hàn) trong mục reconciliation → "điều tra"; `合同` (Trung) trong failure modes → "hợp đồng".
  - Typo dính chữ "nếumerchant" → "nếu merchant" (Senior tip).
  - Sơ đồ `~~~seq` hỏng: 7 actor + nhiều dòng không hợp lệ (`... (ngày đến hạn kỳ 1) ...`, `... (cuối ngày) ...`, `Installment Service -> Auto-debit config`, `Scheduler -> Provider API`, `Provider --> Webhook Receiver`, `Reconciliation Job -> ...`, `-> DB`). Đã viết lại còn 6 actor (Khách | API Gateway | Credit Engine | Installment Service | Scheduler | Payment Gateway), các bước phụ chuyển thành `note`.

Kiểm tra: `node --check js/data/sd-problems.js` OK; 2 sơ đồ mới parse hợp lệ; không còn ký tự lạ; `index-light.js` không bị cũ (không cần build lại).

Lưu ý: `node scripts/validate.js` hiện còn LỖI ở các file KHÔNG thuộc task này (q-frontend.js, quiz-ops.js, lessons-modern.js, lessons-jpa.js, lessons-payments.js, toeic-lr-1a.js) — là thay đổi chưa commit của task khác, không sửa theo luật 3. Riêng `sd-problems.js` sạch (0 lỗi).
