# T2026 — 2 bài học (security) vào lessons-security.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-security.js`
After: T1441

Thêm **2 bài học mới** (track `security`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: lưu mật khẩu đúng cách: hash + salt, BCrypt cost factor, vì sao không dùng SHA-256 trần (bài tập: kiểm tra mật khẩu với hàm băm giả có salt, so sánh thời gian hằng); JWT: cấu trúc, ký, kiểm tra exp/iss/aud, lỗi alg=none (bài tập: verify JWT HMAC bằng javax.crypto).

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-security.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài: `lesson-security-012` (order 12 — lưu mật khẩu: salt, BCrypt cost factor, vì sao SHA-256 trần sai, constant-time comparison) và `lesson-security-013` (order 13 — JWT: cấu trúc, ký/verify HMAC HS256 bằng `javax.crypto`, kiểm tra exp/iss/aud, lỗi `alg=none`).
- Bài tập: `PasswordBox` (hash có salt + cost giả lập, verify constant-time; 5 test) và `JwtVerifier` (verify HS256, chặn `alg=none`, kiểm exp/iss/aud; 6 test). Reference pass 100%, starter biên dịch được với Java 17 và không pass hết.
- Đồng thời dọn phần chạy trước bị gián đoạn: file đang có 4 bài mới trùng lặp (012–015, hai cặp password/JWT). Đã giữ 012–013, xoá 014–015 (cùng là nội dung của task này) để đúng 2 bài mới, không ảnh hưởng bài 001–011.
- Sửa lỗi technical trong nội dung: ví dụ SHA-256 của "123456" trước ghi nhầm prefix MD5 `e10adc...`, đã đổi thành `8d969eef...`; lỗi escape `split("\\.", -1)` trong code mẫu JWT đã sửa để biên dịch Java 17.
- Nghiệm thu: `node --check js/data/lessons-security.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/test-lessons.js lesson-security-012` → 5/5, `lesson-security-013` → 6/6.
- `node scripts/test-lessons.js` (toàn bộ) còn 2 lỗi KHÔNG thuộc task này: `lesson-jpa-012#2` và `lesson-concurrency-016#2` (file của task khác đang sửa dở). Không sửa vì không sở hữu file.
- Không commit, không sửa file ngoài `js/data/lessons-security.js` và `js/data/index-light.js` (file sinh tự động).
Reviewed-by: kilo (T2026R)
