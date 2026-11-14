# T2051 — 12 câu trắc nghiệm (spring) vào quiz-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2036

Thêm **12 câu trắc nghiệm** vào `js/data/quiz-spring.js` (topic `spring`; id `qz-spring-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-spring-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: Spring Boot auto-configuration và bean lifecycle: @ConditionalOnMissingBean, thứ tự @PostConstruct/InitializingBean, scope prototype inject vào singleton, @Async/@Transactional self-invocation, @EventListener vs @TransactionalEventListener phase AFTER_COMMIT, circular dependency trong Boot 3.

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

Đã thêm 12 câu (id `qz-spring-042` … `qz-spring-053`) vào cuối `js/data/quiz-spring.js` (append-only, 426 dòng thêm, không sửa mục cũ). Chủ đề: auto-config + bean lifecycle.

- `042` @ConditionalOnMissingBean bị thiếu → 2 bean cùng kiểu (NoUniqueBeanDefinitionException khi inject)
- `043` scope prototype inject vào singleton (chỉ 1 instance, giữ trong field)
- `044` (multi) @Configuration bị CGLIB subclass; không inject bean vào field cấu hình
- `045` transaction mở lâu trong lúc đọc file → cạn HikariCP
- `046` circular dependency với constructor injection (Boot 2.6+ cấm mặc định)
- `047` (multi) chạy logic lúc khởi động: ApplicationRunner / ApplicationReadyEvent (không dùng @PostConstruct)
- `048` @EventListener vs @TransactionalEventListener (fallbackExecution=false → im lặng khi không có transaction)
- `049` @Async + self-invocation, phải gọi sau commit qua bean khác / afterCommit
- `050` (multi) chẩn đoán auto-config bằng --debug (Condition Evaluation Report) + log DEBUG autoconfigure
- `051` @Lazy trên tham số constructor (proxy, tạo ở lần dùng đầu)
- `052` field injection thiếu bean → fail lúc khởi động (required=true)
- `053` thứ tự proxy @Transactional: mở → method → commit/rollback

Kiểm tra: `node --check js/data/quiz-spring.js` OK; `node scripts/build-light-index.js` đã chạy (thêm 12 id vào `js/data/index-light.js`); `node scripts/validate.js` không còn lỗi nào từ `quiz-spring.js`.

Lưu ý cho integrator: `validate.js` vẫn còn 3 lỗi **không thuộc file này** — `q-spring-data.js: spring-078.a` (inline code chứa `{ }` lồng nhau, thuộc task T2050). Cần agent T2050 sửa; tôi không sửa vì ngoài phạm vi sở hữu.
Reviewed-by: kilo (T2051R)
