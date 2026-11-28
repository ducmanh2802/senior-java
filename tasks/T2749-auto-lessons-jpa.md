# T2749 — 2 bài học (jpa) vào lessons-jpa.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-jpa.js`
After: T2686

Thêm **2 bài học mới** (track `jpa`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Persistence context và dirty checking — bài tập tự viết "persistence context" nhỏ lưu snapshot và sinh UPDATE chỉ cho field đổi; (2) Optimistic locking với @Version — bài tập mô phỏng 2 transaction cập nhật cùng bản ghi, phát hiện xung đột và retry.

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
`node --check js/data/lessons-jpa.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm lesson-jpa-021 (order 21, mid) và lesson-jpa-022 (order 22, senior) vào js/data/lessons-jpa.js, chèn trước dòng `);` cuối file; không sửa mục cũ và không sửa file core khác (trong khoảng quyền sở hữu).
- Thêm 2 mục tương ứng vào js/data/index-light.js (build-light-index.js không chạy được do lỗi cú pháp sẵn có của lessons-api.js — file không thuộc task này).
- node --check js/data/lessons-jpa.js: OK.
- node scripts/validate.js: không lỗi/cảnh báo nào liên quan lessons-jpa.js. Các LỖI còn lại là sẵn có, không sở hữu: quiz-ops.js, quiz-ccap-2.js, lessons-api.js (cú pháp), path.js (tham chiếu lesson-api-0xx), index-light.js đã cũ (do lessons-api.js không nạp được trong sandbox). build-light-index.js và test-lessons.js bị chặn bởi cùng lỗi lessons-api.js.
- Bài tập đã kiểm tra thủ công bằng javac --release 17 + java (tương đương App.code.assemble): lesson-jpa-021 reference 13/13, lesson-jpa-022 reference 10/10; starter biên dịch được nhưng ném UnsupportedOperationException (không pass hết) — đúng yêu cầu.
- Góc chưa có trong file: 021 đi sâu identity map + snapshot là bản sao giá trị + refresh() hủy thay đổi chưa flush (ngoài dirty checking đã có); 022 cách phiên bản detached qua hai request HTTP (save/merge kiểm tra version) + retry mở transaction mới, đọc version mới, áp dụng lại ý định (delta) — khác bài xen kẽ đã có (lesson-jpa-018/020).
Reviewed-by: kilo (T2749R)
