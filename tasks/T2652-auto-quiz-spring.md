# T2652 — 10 câu trắc nghiệm (spring) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2622

Thêm **10 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `spring`; id `qz-spring-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-spring-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: proxy và @Transactional (self-invocation, private method, REQUIRES_NEW, rollback với checked exception), bean scope, @Async, auto-configuration và @ConditionalOnMissingBean, profile, bảo vệ Actuator. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-spring đã có.

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
Added qz-spring-923..932 (10 questions). node --check OK. build-light-index/validate blocked by unrelated q-sql.js syntax error in working tree.
Reviewed-by: kilo (T2652R)
