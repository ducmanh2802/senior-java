# T2036 — 12 câu trắc nghiệm (spring) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T1713

Thêm **12 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `spring`; id `qz-spring-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-spring-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống Spring Boot: bean lifecycle, @Transactional trên private/self-call, @Async, profile và thứ tự property source, @ConfigurationProperties, Spring Security cấu hình SecurityFilterChain, exception handling với @ControllerAdvice.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz-spring.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 12 câu vào `js/data/quiz-spring.js` (append trước `);` cuối, không sửa mục cũ): `qz-spring-030` … `qz-spring-041`.
- Chủ đề: Spring Security SecurityFilterChain & @Order (030, 038), @ConfigurationProperties & cách đăng ký bean (031, 039), vòng đời bean @PostConstruct/DisposableBean (032), @PropertySource vs thứ tự property source của Boot (033), @ControllerAdvice & @Order (034, 037), @Async qua proxy + executor mặc định (035), @Transactional trên method private/self-invocation (036), propagation SUPPORTS (040), BeanPostProcessor áp dụng mọi bean (041).
- 3 câu `multi` (Chọn 2/3): qz-spring-032 [0,1], qz-spring-035 [1,2], qz-spring-038 [0,1,3]. Các câu đơn rải đáp án ở cả 4 vị trí (0,1,2,3).
- Mỗi `explain` giải thích vì sao đúng + vì sao từng phương án sai; có code markup, bảng, ASCII flow, và `> Senior tip:`.
- Nghiệm thu: `node --check js/data/quiz-spring.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo path.js về lesson không thuộc PATH là có sẵn từ trước, không liên quan file này).
- Không commit, không sửa file khác.
Reviewed-by: kilo (T2036R)
