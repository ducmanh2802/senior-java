# T2317 — 20 câu trắc nghiệm Spring Boot 3 mới

Status: DONE
Agent: kilo
Owns: `js/data/quiz-spring.js`
After: T2275

Định dạng QUIZ (AGENTS.md mục 4). Grep `q:` trong file để không trùng. Thêm 20 câu (id tiếp số lớn nhất của topic): @Transactional self-invocation và propagation, bean scope, auto-configuration và @ConditionalOnMissingBean, Spring Boot 3 chuyển sang jakarta.*, Actuator/Micrometer observation, @ConfigurationProperties + validation, RestClient (Boot 3.2+), ProblemDetail (RFC 7807/9457). 1/4 là multi (Chọn 2). explain nói vì sao từng phương án sai; đáp án rải đều vị trí.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm, không được giảm) — task trước từng xoá nhầm câu cũ.

## Nghiệm thu
`node --check js/data/quiz-spring.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

- Đã thêm 20 câu mới vào cuối `js/data/quiz-spring.js` (chỉ THÊM, không sửa/xoá mục cũ — diff của task là thuần insertion ở cuối file).
- **ID trước/sau:** `js/data/quiz-spring.js` trước: 47 câu topic spring, id cao nhất `qz-spring-053` (tổng 137 id trong file). Sau: 67 câu topic spring, id cao nhất `qz-spring-085` (tổng 157 id). Đã thêm đúng 20 id: `qz-spring-066` → `qz-spring-085`.
- **Lưu ý về id:** id cao nhất của topic spring trên toàn ngân hàng là `qz-spring-065` (nằm trong `js/data/quiz.js`, không phải `quiz-spring.js`), nên bắt đầu từ `qz-spring-066` để không trùng id toàn cục.
- Nội dung: NOT_SUPPORTED, TransactionTemplate, transaction không lan sang thread khác, session scope + scoped proxy, prototype không gọi @PreDestroy, @AutoConfigureAfter, thứ tự @ConditionalOnMissingBean vs user config, AutoConfiguration.imports, Boot 3 đổi prefix `spring.data.redis.*`, Micrometer Counter/Timer, Prometheus endpoint, constructor binding + @DefaultValue/Duration, relaxed binding + ignoreUnknownFields, RestClient cơ bản + xử lý lỗi + so sánh RestTemplate/WebClient, ProblemDetail (RFC 9457) với validation, `spring.config.import=configtree:`, Bean Validation groups + cascade @Valid, `spring.autoconfigure.exclude`.
- 5/20 câu multi (`Chọn 2`): 069, 077, 080, 081, 084. Đáp án rải đều: index 0 ×6, 1 ×4, 2 ×3, 3 ×2.
- **Kiểm tra:** `node --check js/data/quiz-spring.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js quiz-spring.js` → `OK — không có lỗi.`
- **Lưu ý acceptance:** `node scripts/validate.js` (toàn bộ) hiện còn **1 lỗi ở file KHÁC**: `sdlc.js: lỗi cú pháp/chạy: missing ) after argument list` (dòng ~11253, `'concurrency-024': {`). File này thuộc task khác (T2318, `js/data/sdlc.js` — không nằm trong phạm vi sở hữu của T2317), đang ở trạng thái sửa dở từ trước; T2317 không được sửa file này. Mọi lỗi liên quan tới `quiz-spring.js` đều đã sạch.
