# T2869 — 2 bài học (testing) vào lessons-testing.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-testing.js`
After: T2745

Thêm **2 bài học mới** (track `testing`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Test double: stub vs mock vs fake vs spy — bài tập tự viết fake repository và đếm lời gọi; (2) Test code phụ thuộc thời gian bằng Clock cố định — bài tập tính phí trễ hạn theo ngày với Clock.fixed.

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
`node --check js/data/lessons-testing.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Vòng 4: hai góc của đề (test double stub/mock/fake/spy; Clock cố định tính phí trễ hạn) đã có ở lesson-testing-013/014 (và 001/002/008/009/010/011/015/016). Theo yêu cầu "chọn góc chưa có", đã thêm 2 bài với góc mới, id/order nối tiếp (17, 18):
  - **lesson-testing-017** (order 17, senior): "Stub có kịch bản và argument captor" — sequenced stub trả chuỗi giá trị theo thứ tự gọi (false,false,true) để test retry/fallback và **phát hiện over-call** khi hết kịch bản; argument captor (spy) để kiểm chứng payload audit không lưu ở đâu. Bài tập: NotificationService gửi OTP có retry + SequencedStubGateway + CapturingAuditLog (6 test, deterministic).
  - **lesson-testing-018** (order 18, senior): "Test nghiệp vụ theo ngày lịch bằng Clock" — LocalDate.now(clock) với ZoneId kinh doanh, periodEnd bằng plusMonths (cuối tháng/năm nhuận), daysRemaining bao gồm hôm nay (off-by-one), so sánh UTC vs UTC+7. Bài tập: SubscriptionService (6 test, deterministic).
- Mỗi bài: body kết bằng "### Liên hệ phỏng vấn", 1 bài tập Java thuần (JDK chuẩn, Java 17, không class public ngoài Main), tests ≥ 3 deterministic, 3 câu check, related là id câu hỏi có thật (testing-003/057/011 và testing-052/006/055 — đã xác nhận tồn tại trong q-soft.js).
- Nghiệm thu: `node --check` OK; `node scripts/test-lessons.js lesson-testing-017` → 6/6; `lesson-testing-018` → 6/6 (reference pass hết, starter biên dịch được và không pass hết); `node scripts/build-light-index.js` OK; `node scripts/validate.js` KHÔNG báo lỗi nào thuộc lessons-testing.js (các lỗi còn lại thuộc file của task khác: q-frontend, quiz-ops, quiz-ckad-1, lessons-modern, lessons-jpa, lessons-payments, toeic-lr — không sở hữu, không sửa).
- Không commit.
Reviewed-by: kilo (T2869R)
