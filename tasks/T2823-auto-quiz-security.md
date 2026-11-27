# T2823 — 10 câu trắc nghiệm (security) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2789

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `security`; id `qz-security-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-security-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: Spring Security 6 SecurityFilterChain, JWT (ký, hết hạn, refresh token rotation), CSRF khi dùng cookie, OAuth2 Authorization Code + PKCE, lưu mật khẩu (BCrypt/Argon2), SQL injection qua ORDER BY động, IDOR. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-security đã có.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/quiz-spring.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 10 câu vào `js/data/quiz-spring.js` (topic `security`), id nối tiếp từ lớn nhất trước đó (qz-security-047): **qz-security-048 … qz-security-057**.
- Góc mới (vòng 4), không trùng 038–047: 048 JWT hết hạn (exp) → 401 vs 403; 049 lưu token HttpOnly/SameSite vs localStorage (multi); 050 OAuth2 `state` chống CSRF; 051 BCrypt giới hạn 72 byte; 052 alg confusion / alg=none; 053 MyBatis `#{}` vs `${}` + ORDER BY whitelist (multi); 054 Broken Function Level Authorization (@PreAuthorize hasRole); 055 giới hạn SameSite so với CSRF token; 056 CORS không phải auth (multi); 057 redirect_uri exact match.
- 3/10 câu `multi: true` (049, 053, 056), đáp án đúng rải đều vị trí; mỗi `explain` nêu vì sao đúng + vì sao từng phương án sai.
- Lưu ý kỹ thuật: nội dung `${...}` trong template literal phải escape thành `\${...}`; tránh bọc `{{ }}` quanh chuỗi có `{ }` lồng nhau (validator báo lỗi) — 053/054 viết MyBatis syntax ở dạng text.
- Nghiệm thu: `node --check js/data/quiz-spring.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → **không còn lỗi nào thuộc quiz-spring.js** (các lỗi còn lại nằm ở file của agent khác: q-frontend, quiz-ops, lessons-*, path.js — không sửa theo luật 3). KHÔNG commit.
Reviewed-by: kilo (T2823R)
