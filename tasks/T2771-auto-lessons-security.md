# T2771 — 2 bài học (security) vào lessons-security.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-security.js`
After: T2700

Thêm **2 bài học mới** (track `security`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) JWT từ bên trong — bài tập tự ký và kiểm tra HMAC-SHA256 bằng javax.crypto.Mac, kiểm tra exp và từ chối alg sai; (2) Lưu mật khẩu đúng cách — bài tập PBKDF2 (SecretKeyFactory PBKDF2WithHmacSHA256) với salt, so sánh hằng thời gian (MessageDigest.isEqual).

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
`node --check js/data/lessons-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài mới (vòng 3, chọn góc CHƯA có trong file — file đã có 18 bài, trong đó 001/002/015/016/017/018 đã viết JWT HS256 và PBKDF2):
  - `lesson-security-019` (order 19, senior): JWT kiểm tra claim đầy đủ — aud/iss/nbf + leeway (clock skew) + từ chối alg sai; góc mới = token confusion (dùng chéo token giữa các service do thiếu kiểm aud). 1 bài tập `JwtAuth` (11 test, reference pass 11/11).
  - `lesson-security-020` (order 20, senior): Đăng nhập PBKDF2 không rò rỉ — so sánh hằng thời gian (MessageDigest.isEqual) + dummy hash chống username enumeration; góc mới = timing do user-không-tồn-tại. 1 bài tập `LoginService` (8 test, reference pass 8/8).
- Chỉ sửa `js/data/lessons-security.js` (chỉ THÊM, không sửa mục cũ) + `js/data/index-light.js` (sinh lại bằng build-light-index).
- Nghiệm thu: `node --check` OK; `node scripts/test-lessons.js lesson-security-019` → 11/11, `...020` → 8/8 (reference pass hết, starter biên dịch được & không pass hết); `node scripts/build-light-index.js` OK; `node scripts/validate.js` → 0 lỗi trong file security (các lỗi còn lại thuộc file khác: lessons-payments, lessons-jpa, lessons-modern, quiz-ops — có sẵn từ task khác, không thuộc sở hữu T2771).
- Không commit.
Reviewed-by: kilo (T2771R)
