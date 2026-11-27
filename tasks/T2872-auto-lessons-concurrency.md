# T2872 — 2 bài học (concurrency) vào lessons-concurrency.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`
After: T2748

Thêm **2 bài học mới** (track `concurrency`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Semaphore và rate limit đồng thời gọi đối tác (tối đa 20 request song song) — bài tập tự chấm với CountDownLatch; (2) Structured concurrency về mặt khái niệm và cách làm tương đương trên Java 17 bằng ExecutorService + Future có timeout, huỷ các tác vụ còn lại khi một tác vụ lỗi.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/lessons-concurrency.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài mới (order nối tiếp bài cuối 32): **lesson-concurrency-033** (order 33) và **lesson-concurrency-034** (order 34).
- Vòng 4: hai chủ đề yêu cầu (Semaphore rate-limit gọi đối tác tối đa 20 song song; Structured concurrency trên Java 17) đã có nhiều bài (022, 025, 026, 027, 028, 029, 030, 031, 032). Theo luật vòng 4, chọn góc CHƯA có:
  - 033: **Semaphore self-deadlock / pool starvation** — giữ permit rồi đồng bộ chờ việc con cũng xin permit từ cùng Semaphore; sửa bằng xin đủ permit lên trước (tryAcquire(n) nguyên tử) + fail-fast; 1 bài tập PartnerGate (5 test tất định với CountDownLatch, có cả test chứng minh không tự-khoá).
  - 034: **Structured concurrency chính sách ShutdownOnSuccess (first-success)** trên Java 17 bằng ExecutorService + CompletionService + deadline chung + cancel(true), phân biệt với ShutdownOnFailure; 1 bài tập FirstSuccess (5 test tất định).
- Nghiệm thu: `node --check` OK; `node scripts/test-lessons.js lesson-concurrency-033` → 5/5; `lesson-concurrency-034` → 5/5 (reference pass hết, starter biên dịch được và không pass hết); `node scripts/build-light-index.js` chạy lại; `node scripts/validate.js` KHÔNG còn lỗi nào thuộc file này (concurrency 30→32 bài).
- Lưu ý: `validate.js` vẫn in LỖI ở các file KHÁC không thuộc task này (q-frontend.js, quiz-ops.js, lessons-modern.js, lessons-jpa.js, lessons-payments.js, toeic-lr) — là lỗi có sẵn từ task khác, không sửa theo luật 3 AGENTS.md.
- Không commit.
Reviewed-by: kilo (T2872R)
