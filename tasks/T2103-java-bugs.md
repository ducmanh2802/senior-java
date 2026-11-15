# T2103 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T2087

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) Báo cáo doanh thu sai do dùng double cho tiền và làm tròn sai khi chia phí cho nhiều người (tổng lệch vài đồng); test tái hiện xác định; reference: BigDecimal với RoundingMode rõ ràng và phân bổ phần dư (largest remainder)

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

Đã thêm 2 bài vào js/data/bugs.js (không sửa file khác, không làm mất bài của người khác):
- bug-034: Báo cáo doanh thu sai do dùng double + làm tròn khi chia phí cho nhiều đối tác; sửa bằng số học nguyên (base + phần dư largest remainder), reference BigDecimal/RoundingMode.
- bug-035: Tính đơn giá/trung bình bằng BigDecimal.divide thiếu scale + RoundingMode -> ném ArithmeticException; sửa bằng divide(divisor, scale, RoundingMode.HALF_UP).

Xác minh:
- node --check js/data/bugs.js: OK
- node scripts/test-bugs.js bug-034: reference 6/6, starter 2/6 (tái hiện bug) -> OK
- node scripts/test-bugs.js bug-035: reference 5/5, starter 2/5 (tái hiện bug) -> OK
- node scripts/validate.js bugs.js: không có lỗi bugs.js

Ghi chú: node scripts/validate.js (tất cả file) và node scripts/build-light-index.js không thể in OK trong session này do lỗi SỐC TRƯỚC trong các file KHÔNG thuộc task này (q-devops.js, lessons-devops.js, q-spring-data.js bị chỉnh sửa bởi agent khác; index-light.js đã cũ; build-light-index.js crash ở q-spring-data.js). index-light.js không chứa bugs nên không bị ảnh hưởng bởi sửa bugs.js. Không commit theo quy ước.
Reviewed-by: verify-only (code/UI task)
