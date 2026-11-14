# T2070 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2053

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) BigDecimal so sánh bằng equals (2.0 vs 2.00 khác scale) và dùng double cho tiền khiến đối soát thanh toán lệch vài đồng trên hàng nghìn giao dịch: test tái hiện bằng dữ liệu cố định; reference: dùng compareTo, setScale với RoundingMode.HALF_UP đúng chỗ, không tạo BigDecimal từ double (BigDecimal.valueOf hoặc từ String)

Test phải **tái hiện bug một cách xác định** (latch/barrier, fake repository đếm query, Clock cố định…), reference pass 100% (≥ 3 test), starter biên dịch được và KHÔNG pass hết. Chỉ JDK chuẩn, không class public ngoài Main, Java 17.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/bugs.js`; `node scripts/build-light-index.js`; `node scripts/test-bugs.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Thêm bug-030 (double và BigDecimal(double) sai scale sai lệch đối soát thanh toán, ReconciliationService) và bug-031 (BigDecimal.equals so sánh cả scale -> HashSet dedupe sai, PaymentDedupe). test-bugs.js: starter 0/5 và 2/4, reference 5/5 và 4/4. validate.js → OK.
Reviewed-by: verify-only (code/UI task)
