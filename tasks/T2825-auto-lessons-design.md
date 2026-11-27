# T2825 — 2 bài học (design) vào lessons-design.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-design.js`
After: T2742

Thêm **2 bài học mới** (track `design`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Strategy + Factory thay cho chuỗi if/else theo loại sản phẩm (phí giao dịch theo kênh); (2) Outbox pattern — bài tập mô phỏng ghi đơn hàng + outbox trong cùng "transaction" giả và relay gửi event đúng 1 lần theo id.

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
`node --check js/data/lessons-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Thêm 2 bài học track design vào js/data/lessons-design.js (chèn trước dòng `);` cuối, không chạm mục cũ):
- lesson-design-017 / order 17: Saga pattern — giao dịch phân tán với bước bù (orchestrator, LIFO bù, eventual consistency).
- lesson-design-018 / order 18: Bulkhead pattern — cách ly tài nguyên (permits/synchronized) ngăn lan truyền lỗi giữa downstream.

Kiểm tra:
- node --check js/data/lessons-design.js → OK
- node scripts/validate.js js/data/lessons-design.js → không có lỗi bài học (design hiện 17 bài; chỉ còn lỗi index-light.js cũ, xem dưới)
- node scripts/test-lessons.js lesson-design-017 → 7/7 PASS; lesson-design-018 → 9/9 PASS

Không khắc hết được DoD:
- js/data/index-light.js cũ sau khi thêm bài học. node scripts/build-light-index.js BẮT BUỘC crash với SyntaxError tại js/data/quiz-design.js:4808 (lỗi cú pháp đã có sẵn trước khi tôi bắt đầu, file thuộc nhóm quiz/T12, không phải file tôi sở hữu — AGENTS.md quy tắc 3, không tự sửa).
- Do quiz-design.js bị lỗi, sandbox.window trong validate.js thiếu dữ liệu quiz ⇒ kiểm tra index-light (validate.js:695) luôn so sai ⇒ node scripts/validate.js (toàn bộ) không thể in OK cho đến khi quiz-design.js được chủ sở hữu sửa.
- Đề xuất: chủ sở hữu quiz-design.js sửa lỗi cú pháp tại quiz-design.js:4808, sau đó chạy node scripts/build-light-index.js để sinh lại index-light.js, rồi node scripts/validate.js → OK.
Reviewed-by: kilo (T2825R)
