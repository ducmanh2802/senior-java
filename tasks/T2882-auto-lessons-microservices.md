# T2882 — 2 bài học (microservices) vào lessons-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`
After: T2753

Thêm **2 bài học mới** (track `microservices`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Circuit breaker từ bên trong — bài tập tự viết circuit breaker 3 trạng thái với Clock giả và sliding window đếm lỗi; (2) Idempotency key cho API thanh toán — bài tập lưu kết quả theo key, request lặp trả cùng kết quả, request khác payload cùng key bị từ chối.

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
`node --check js/data/lessons-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm lesson-microservices-033 (order 33): circuit breaker 3 trạng thái (CLOSED/OPEN/HALF_OPEN), cửa sổ trượt theo thời gian, đồng hồ giả. Góc khác bài 015 (đếm liên tiếp) và 016 (cửa sổ cố định số lệnh): dùng cửa sổ theo thời gian, lỗi cũ hết hạn.
- Đã thêm lesson-microservices-034 (order 34): idempotency key thanh toán với TTL. Góc khác bài 032 (không TTL, PENDING/DONE vĩnh viễn): thêm TTL cho PENDING (hết hạn -> chạy lại), DONE vĩnh viễn (luôn REPLAY), xử lý phantom PENDING.
- related dùng id câu hỏi thực: 033 -> microservices-060, microservices-061; 034 -> microservices-041.
- tests: 033 = 12 case, 034 = 8 case, đều deterministic bằng fake clock / now() thủ công. reference pass 100%, starter ném UnsupportedOperationException.
Reviewed-by: kilo (T2882R)
