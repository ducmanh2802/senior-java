# T2022 — 2 bài sửa bug production Java vào bugs.js

Status: DONE
Agent: kilo
Owns: `js/data/bugs.js`
After: T1706

Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: (1) dùng SimpleDateFormat static chung giữa nhiều thread làm parse ngày sai ngẫu nhiên trong báo cáo (sửa: DateTimeFormatter bất biến); (2) so sánh tiền bằng BigDecimal.equals làm 10.0 khác 10.00 nên đối soát giao dịch báo lệch (sửa: compareTo, chuẩn hoá scale).

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
- Không thêm bug-024/bug-025: cả hai chủ đề yêu cầu đã tồn tại sẵn và không trùng lại (AGENTS.md §6, quy tắc 14 task):
  + bug-022: SimpleDateFormat static chia sẻ giữa nhiều luồng làm parse ngày sai ngẫu nhiên -> sửa bằng DateTimeFormatter bất biến.
  + bug-023: BigDecimal.equals so 10.0 vs 10.00 -> compareTo + chuẩn hoá scale.
- Sửa hai lỗi schema chặn nghiệm thu trong bugs.js (file sở hữu của task, chỉ bổ sung trường thiếu, không đổi nội dung bài):
  + bug-022 starter thiếu method dayCodesFormat(Date) và parseStrictPartnerDate(String) mà tests gọi -> tests không biên dịch với starter. Đã bổ sung additively (giữ SimpleDateFormat chia sẻ = bản lỗi).
  + bug-023 tests thiếu dòng in "RESULT passed/total" -> validate báo lỗi. Đã bổ sung.
- Xác minh: node --check js/data/bugs.js OK; node scripts/test-bugs.js bug-022 (reference 5/5, starter thất bại) và bug-023 (reference 8/8, starter 3/8) pass; node scripts/validate.js in "OK — không có lỗi." KHÔNG commit.
Reviewed-by: verify-only (code/UI task)
