# T2344R — Fact-check nội dung mới của T2344

Status: DONE
Agent: opencode
Owns: `js/data/q-banking.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2344 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã soát `git diff HEAD -- js/data/q-banking.js` (nội dung mới: banking-062..066 và đoạn bị đứt trong Iso8583Service).
- **Sửa lỗi cú pháp/logic code bị hỏng (ngoài phạm vi "kiến thức" nhưng bắt buộc để file hợp lệ):** `Iso8583Service.parseBitmap` — diff T2344 chèn nhầm `}, );` vào trong vòng lặp `if/for` (làm vỡ cấu trúc code Java trong block `~~~java` và dư ký tự `},` gây nguy cơ parse). Đã khôi phục về vòng lặp đóng ngoặc đúng (`bitmap.set(i * 8 + j); } } }`).
- **Kiểm tra kiến thức banking-062..066:** nội dung đúng về clarification/chuyển tiền nội bộ (atomicity/race condition/idempotency/Saga vs 2PC context), thanh toán QR (static/dynamic, webhook retry/reconciliation), hoàn tiền (idempotency key, liên kết transaction gốc, maker-checker, partial/full), nạp tiền từ thẻ (3D Secure/OTP, PCI DSS, tokenization, không lưu CVV, recon), hạn mức giao dịch (theo giao dịch/ngày/tháng, nhóm user/eKYC, real-time). Không phát hiện API/flag bịa, cơ chế nói ngược hay số liệu vô căn cứ cần chỉnh. Không sửa văn phong/bố cục.
- Kiểm tra: `node --check js/data/q-banking.js` OK.
- `node scripts/validate.js` **chưa OK toàn repo** do lỗi cú pháp có sẵn/ngoài scope: `quiz-ccao-2.js: lỗi cú pháp/chạy: missing ) after argument list` (xác nhận `node --check js/data/quiz-ccao-2.js` báo lỗi tại dòng ~298). Không thuộc quyền sở hữu task này, không sửa. Cần integrator/owner của `quiz-ccao-2.js` khắc phục để validator toàn cục OK.
