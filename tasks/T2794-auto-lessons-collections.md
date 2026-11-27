# T2794 — 2 bài học (collections) vào lessons-collections.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-collections.js`
After: T2732

Thêm **2 bài học mới** (track `collections`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) TreeMap và NavigableMap — bài tập tra biểu phí theo bậc (floorEntry) và tìm khung giờ trống; (2) Iterator fail-fast và ConcurrentModificationException — bài tập xoá phần tử đúng cách (removeIf, iterator.remove) và giải thích modCount.

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
`node --check js/data/lessons-collections.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Lần chạy trước bị gián đoạn đã thêm sẵn 6 bài (lesson-collections-011..016) vào file, trong đó đúng 2 bài task yêu cầu: **015 TreeMap/NavigableMap (tra biểu phí theo bậc bằng floorEntry + tìm khung giờ trống bằng tailMap)** và **016 Iterator fail-fast/ConcurrentModificationException (removeIf, iterator.remove, chỉ số lui, phân biệt fail-fast/fail-safe/weakly consistent)**. Giữ lại toàn bộ, chỉ sửa lỗi.
- Sửa lỗi cú pháp do lần trước để lại: 3 chỗ dùng backtick trong template literal của lesson-015 body (now/duration/a.amount - b.amount) → đổi sang {{...}}; lesson-016.check[0].q bị {{/}} không khớp (2/1) → viết lại câu hỏi.
- Sửa test sai của lesson-015 bài 1: các assertion copy nhầm từ lesson-004 (bậc 0/10tr/500tr) trong khi standard() dùng bậc 0/500/10000 → cập nhật lại feeFor/nextThreshold cho khớp dữ liệu; reference giữ nguyên (đã đúng).
- Nghiệm thu: node --check OK; build-light-index OK; validate.js không còn lỗi nào thuộc lessons-collections.js (các lỗi còn lại thuộc file khác: quiz-ops, lessons-modern/jpa/payments, upwork-*); test-lessons.js: lesson-collections-015/016 reference pass 100%, starter biên dịch được và không pass hết (7 lỗi còn lại thuộc track aws/architecture/banking của task khác).
- Không commit.
Reviewed-by: kilo (T2794R)
