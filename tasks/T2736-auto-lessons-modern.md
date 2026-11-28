# T2736 — 2 bài học (modern) vào lessons-modern.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-modern.js`
After: T2665

Thêm **2 bài học mới** (track `modern`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) record + sealed interface + pattern matching cho switch (Java 21) để mô hình hoá kết quả nghiệp vụ thay cho exception; (2) Stream nâng cao: Collectors.groupingBy/partitioningBy/teeing, khi nào stream chậm hơn vòng for.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm (chỉ JDK chuẩn, Java 17, không class public ngoài Main), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/lessons-modern.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Da them 2 bai hoc track modern:
- lesson-modern-012 (order 12): Record pattern long, switch expression exhaustive va guard: ket qua kiem tra don hang hang lot thay cho exception. Moc moi: record pattern long (boc component cua record ben trong), bang so sanh 3 cach (Exception vs CheckResult vs Optional), tinh huong kiem tra ton kho 50.000 don/ngay. Bai tap: BatchCheck.summary (instanceof pattern, Java 17). 5/5 test pass.
- lesson-modern-013 (order 13): Stream pipeline hieu qua: antipattern hay gap, bao cao da chieu voi groupingBy/partitioningBy/teeing, va chon stream vs for bang so lieu. Moc moi: hop nhat partitioningBy + teeing (chua co o bai cu), mang cac antipattern stream (peek, distinct bo nho, sorted vo han, flatMap no, boxing, toList trieu dong), bang quyet chon stream vs for co so lieu thuc te. Bai tap: InvoiceAging.report (6/6 pass), HotPath.sumValidCents (5/5 pass).
Da chay: node --check (OK), node scripts/build-light-index.js (OK), node scripts/validate.js (khong loi trong lessons-modern.js; cac loi con lai o file khac uu quan, khong sua theo luat 3), node scripts/test-lessons.js (ca 2 bai: reference pass het, starter dien duoc va khong pass het).
Reviewed-by: kilo (T2736R)
Verify-failed: 2026-11-26 01:52:05
