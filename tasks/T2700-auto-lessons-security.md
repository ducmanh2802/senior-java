# T2700 — 2 bài học (security) vào lessons-security.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-security.js`
After: T2628

Thêm **2 bài học mới** (track `security`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) JWT từ bên trong — bài tập tự ký và kiểm tra HMAC-SHA256 bằng javax.crypto.Mac, kiểm tra exp và từ chối alg sai; (2) Lưu mật khẩu đúng cách — bài tập PBKDF2 (SecretKeyFactory PBKDF2WithHmacSHA256) với salt, so sánh hằng thời gian (MessageDigest.isEqual).

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
`node --check js/data/lessons-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài mới (nối tiếp order 16 → 17, 18), file chỉ THÊM, không sửa mục cũ:
  - `lesson-security-017` (order 17, senior): **Refresh token rotation** — tự ký/kiểm HS256 bằng javax.crypto.Mac, kiểm exp, cố định alg (chặn alg:none/confusion), xoay vòng + phát hiện tái sử dụng (reuse detection) thu hồi cả chuỗi, revoke khi đăng xuất. 1 bài tập Java thuần (9 test deterministic, reference pass 9/9, starter biên dịch được & không pass hết).
  - `lesson-security-018` (order 18, senior): **Pepper + PBKDF2** — trộn pepper bằng HMAC-SHA256 (javax.crypto.Mac) trước PBKDF2WithHmacSHA256, salt riêng từng user, so hằng thời gian bằng MessageDigest.isEqual, đọc số vòng từ chuỗi lưu, rehash-on-login khi xoay pepper. 1 bài tập (8 test deterministic, reference pass 8/8, starter biên dich & không pass hết).
- Góc chưa trùng: bài 015/016 (vòng trước) đã có JWT cơ bản và PBKDF2 cơ bản; hai bài mới chọn tình huống khác (vòng đời refresh token + thu hồi; pepper ngoài DB + xoay vòng) theo yêu cầu "vòng 2".
- related dùng id câu hỏi có thật: 017 → security-003/017/034; 018 → security-029/036/070.
- Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/test-lessons.js lesson-security-017` = 1/1, `...lesson-security-018` = 1/1 (reference pass hết, starter không pass hết).
- `node scripts/validate.js`: KHÔNG có lỗi/cảnh báo nào ở lessons-security.js (security 18 bài). Validate toàn cục còn 2 LỖI thuộc file của task khác đang dở (lessons-jpa.js: lesson-jpa-020 body < 2500; lessons-jvm.js: lesson-jvm-004 related jvm-032 không tồn tại) — KHÔNG sửa vì ngoài quyền sở hữu (AGENTS mục 3).
- Không commit, không kill tiến trình, không mở trình duyệt, không npm install.
Reviewed-by: kilo (T2700R)
