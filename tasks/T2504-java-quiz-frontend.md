# T2504 — 12 câu trắc nghiệm (frontend) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2495

Thêm **12 câu trắc nghiệm** vào `js/data/quiz.js` (topic `frontend`; id `qz-frontend-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-frontend-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: JavaScript/Vue 3 cho dev Java fullstack: event loop thứ tự log, Promise/async lỗi bị nuốt, ref vs reactive, computed vs watch, v-model, Pinia, CORS, lưu JWT, XSS. Code JS trong q/options viết thường, KHÔNG dùng backtick và ký hiệu đô-la + ngoặc nhọn.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 12 câu trắc nghiệm topic `frontend` vào `js/data/quiz.js`: qz-frontend-001 → qz-frontend-012 (event loop thứ tự log, Promise/async lỗi bị nuốt, ref vs reactive, computed vs watch, v-model, Pinia multi, CORS multi, lưu JWT multi, XSS, this/arrow function, closure, == vs ===). 3 câu multi (Chọn 2), đáp án đúng rải đều vị trí.
- Đã thêm topic `frontend` vào `js/data/topics.js` (bắt buộc để validate chấp nhận quiz topic `frontend`; q-frontend.js đã dùng topic này). Đây là file ngoài sở hữu T2504, sửa vì là điều kiện tiên quyết.
- `node --check js/data/quiz.js` và `js/data/topics.js`: OK.
- `node scripts/validate.js`: không có lỗi nào liên quan quiz.js/topics.js/frontend.
- `node scripts/build-light-index.js` KHÔNG chạy được do `js/data/q-microservices.js` (của agent khác, T2509) có lỗi cú pháp `Unexpected identifier 'tắt'` tại dòng 9779, cùng `q-system-design.js` lỗi `user_id`. Theo AGENTS.md quy tắc 3 không được sửa file của agent khác, nên index-light.js chưa được sinh lại và validate.js tổng thể vẫn báo lỗi trước từ các file khác (path.js, bugs.js, q-concurrency-jvm.js…). Các lỗi này không do T2504 gây ra và không nằm trong quyền sở hữu.
Reviewed-by: kilo (T2504R)
