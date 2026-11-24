# T2670 — 2 bài học (aws) vào lessons-aws.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-aws.js`
After: T2575

Thêm **2 bài học mới** (track `aws`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) SQS: visibility timeout, DLQ, idempotent consumer — bài tập mô phỏng hàng đợi có visibility timeout bằng Java thuần; (2) S3 presigned URL và multipart upload — bài tập mô phỏng ghép part và kiểm tra ETag.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/lessons-aws.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài mới (vòng 2, góc chưa có trong file):
  - `lesson-aws-011` (order 11, senior): SQS **message timer (delay queue)** kết hợp visibility timeout, DLQ và consumer idempotent. Bài tập mô phỏng queue có cả delay + visibility + DLQ + idempotent (16 case). Góc mới so với 003/007/009: thêm chiều message timer (DelaySeconds) — trước đó chỉ có visibility/DLQ/FIFO.
  - `lesson-aws-012` (order 12, senior): S3 multipart — ETag ghép từ part (MD5-của-MD5 + "-N") và **conditional write (If-None-Match: *)** chống ghi đè. Bài tập mô phỏng upload part, kiểm ETag, ghép 1..N và conditional create (12 case). Góc mới so với 002/008/010: thêm conditional write/optimistic concurrency.
- File đã có sẵn 6 bài (001–006) trong HEAD; 007–010 là nội dung từ lần chạy trước bị gián đoạn (chưa commit). Đã "giữ phần tốt, sửa lỗi":
  - `lesson-aws-008`: sửa hằng ETag sai trong test (e65de1… → 9ffa0692…-3 đúng công thức raw-digest) và sửa assertion "dữ liệu khác có etag khác" (dùng d2 thay vì d3).
  - `lesson-aws-010`: mở rộng body từ 2253 lên >2500 ký tự (validate yêu cầu ≥2500), giữ nguyên bài tập/check.
- Nghiệm thu: `node --check js/data/lessons-aws.js` OK; `node scripts/_test-lessons-file.js lessons-aws.js` → 12/12 (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js lessons-aws.js` → không còn lỗi thuộc file này.
- BLOCKER (không thuộc quyền sở hữu, KHÔNG tự sửa theo luật 3): `js/data/lessons-design.js` đang lỗi cú pháp ("missing ) after argument list", do task khác — làm `node scripts/build-light-index.js` crash và `node scripts/validate.js` (chạy full) báo lỗi file đó + `index-light.js` cũ. Cần integrator chạy lại `node scripts/build-light-index.js` sau khi gộp đủ các task (khi lessons-design.js đã được sửa) để cập nhật `js/data/index-light.js`.
- KHÔNG commit.
Reviewed-by: kilo (T2670R)
