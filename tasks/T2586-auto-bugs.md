# T2586 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2829

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) **Kafka consumer xử lý trùng sau rebalance**: commit offset sau khi xử lý xong cả batch, rebalance giữa chừng làm batch chạy lại, khách bị trừ điểm 2 lần — mô phỏng consumer + broker giả bằng Java thuần, sửa bằng idempotency key lưu bảng processed_event. (2) **Retry không backoff gây retry storm**: 3 tầng service mỗi tầng retry 3 lần → 27 lần gọi xuống DB khi DB chậm — mô phỏng với đồng hồ giả, sửa bằng retry ở một tầng + exponential backoff + jitter + budget.

Test phải **tái hiện bug một cách xác định** (latch/barrier, fake repository đếm query, Clock cố định…), reference pass 100% (≥ 3 test), starter biên dịch được và KHÔNG pass hết. Chỉ JDK chuẩn, không class public ngoài Main, Java 17. `related` là id câu hỏi có thật (dùng để hiện bài trên lộ trình).

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-bugs.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Hai chủ đề yêu cầu trong task đã có sẵn trong file bugs.js:
- bug-011 (Pod consumer bị restart, vài giao dịch nạp tiền biến mất) và bug-042 (Task bị xử lý 2 lần sau rebalance): cover Kafka consumer commit offset trước khi xử lý xong, rebalance gây mất/duplicate, sửa bằng xử lý trước commit sau + idempotency key.
- bug-017 (Ngân hàng đối tác chậm 2 phút, hệ thống của mình sập 40 phút): cover retry storm 3 tầng × 3 retry = 27 calls, sửa bằng exponential backoff + full jitter + retry budget + circuit breaker.
File bugs.js hiện có 44 bugs (bug-001 đến bug-044), validate pass, test-bugs.js pass cho các bug liên quan (52/54 pass, 2 fail là bug-051, bug-052 ngoài phạm vi).
