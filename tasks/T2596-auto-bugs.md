# T2596 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2586

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) **BigDecimal so sánh bằng equals**: 10.0 và 10.00 bị coi là khác nhau, giao dịch đối soát báo lệch 1.200 bản ghi — sửa bằng compareTo / chuẩn hoá scale. (2) **Làm tròn tiền sai khi chia phí cho nhiều phần**: chia 100.000đ cho 3 phần bằng HALF_UP bị lệch 1đ tổng — sửa bằng phân bổ phần dư cho phần cuối, test tổng luôn bằng gốc.

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

Đã thêm 2 bài vào `js/data/bugs.js` (nối tiếp bug-054):

- **bug-055** — "Báo cáo gộp theo số tiền: 10.0 và 10.00 bị tách thành hai nhóm" (mid/P2, 25'). Góc BigDecimal `equals`/`hashCode` so cả scale khi dùng làm khoá `HashMap` (gộp báo cáo tách nhóm). Sửa: chuẩn hoá `setScale(2, HALF_UP)` trước khi làm khoá.
- **bug-056** — "Chia phí thanh toán cho nhiều đối tác: làm tròn HALF_UP làm tổng lệch 1 đồng" (mid/P2, 20'). Góc chia phí bằng `BigDecimal.divide(n,0,HALF_UP)` làm tròn độc lập → tổng lệch; sửa: phần cuối = tổng gốc − tổng n−1 phần (gánh dư).

Trùng chủ đề đã có: `bug-023` (BigDecimal equals trong đối soát cặp) và `bug-003` (chia tiền bằng số nguyên `Math.round`). Theo luật "chọn góc khác gần nhất chưa có", hai bài mới chọn góc khác: (1) dùng BigDecimal làm **khoá Map** (equals/hashCode) thay vì so sánh cặp; (2) chia phí bằng **HALF_UP** + phần cuối gánh dư, thay vì số học nguyên.

Nghiệm thu:
- `node --check js/data/bugs.js` → OK.
- `node scripts/build-light-index.js` → đã sinh lại `js/data/index-light.js`.
- `node scripts/test-bugs.js bug-055` → reference 6/6, starter 1/6 (không pass hết).
- `node scripts/test-bugs.js bug-056` → reference 6/6, starter 3/6 (không pass hết).
- `node scripts/validate.js`: **bugs.js không có lỗi nào** (lọc `grep bugs.js` → rỗng). Validate toàn cục vẫn báo lỗi ở các file KHÁC không thuộc task này (q-frontend.js, quiz-java.js, quiz-ops.js, lessons-jpa/modern/payments.js, toeic-lr-1a.js…) do các task khác đang dở; task này chỉ sở hữu `js/data/bugs.js` nên không sửa chúng.

`related` dùng `core-012` (câu BigDecimal/tiền có thật trong q-java.js). Không commit.
Reviewed-by: verify-only (code/UI task)
