# T2683 — 10 câu trắc nghiệm (frontend) vào quiz-gaps.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-gaps.js`
After: T2657

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-gaps.js` (topic `frontend`; id `qz-frontend-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-frontend-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: Vue 3: ref vs reactive, computed vs watch, key trong v-for, lifecycle onMounted/onUnmounted, axios interceptor refresh token, CORS preflight với Spring Security, SPA fallback index.html khi deploy cùng Spring Boot. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-frontend đã có.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/quiz-gaps.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 10 câu hỏi: qz-frontend-053 đến qz-frontend-062.
- 053: shallowRef mutation không trigger re-render
- 054: defineProps destructuring reactivity + default value (multi)
- 055: fetch pending khi component unmount → warning setState
- 056: watchEffect flush: 'post' timing
- 057: refresh token endpoint trả 401 → clear token + redirect login
- 058: CORS + credentials bắt buộc allowedOrigins cụ thể + allowCredentials (multi)
- 059: Cache strategy: index.html no-cache, assets hash immutable 1y
- 060: defineModel two-way binding tự động
- 061: effectScope cho reactive effect ngoài component (multi)
- 062: Nginx reverse proxy: serve static, proxy API, SPA fallback

validate.js: không có lỗi từ 10 câu mới. Lỗi còn lại là pre-existing ở file khác (q-devops.js, labs-sql.js, lessons-*, path.js).
Reviewed-by: kilo (T2683R)
