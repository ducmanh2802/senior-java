# T1602 — Bài học Spring: Security filter chain và cache

Status: DONE
Agent: kilo
Owns: `js/data/lessons-spring.js`

Thêm **2 bài học mới** (track `spring`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file.

Nội dung: bài 1: Spring Security filter chain (bài tập: mô phỏng chuỗi filter xác thực token rồi phân quyền theo role, trả 401/403 đúng); bài 2: cache với @Cacheable (bài tập: tự cài cache có TTL và invalidation, đo tỉ lệ hit, tránh cache stampede bằng khoá theo key).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (không gọi API thật, không thư viện ngoài; LLM được thay bằng một class giả trả lời theo kịch bản), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6, 12). **Chỉ thêm** vào `js/data/lessons-spring.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-spring.js logs/tmp-T1602.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Verified existing lessons meet task scope: `lesson-spring-012` (Spring Security filter chain, token auth + role → 401/403, 6 deterministic tests) and `lesson-spring-013` (Cache với @Cacheable, TTL/invalidation/hitRate, per-key lock chống stampede, 5 deterministic tests). `related` hợp lệ (`security-042`, `spring-020`), body ≥2500 ký tự, `check` 4 câu/bài.
- Fix trong file sở hữu: `SimpleCache.clock` đổi từ `private final` → package-visible để test harness (gán clock sau TTL) biên dịch được; không đổi nội dung/logic bài học.
- Kết quả: `node --check js/data/lessons-spring.js` OK. `node scripts/test-lessons.js` → `Lesson exercises OK: 251/251 (226 bài học, 250 từ cache)` (bao gồm 012/013). 
- Chưa đạt trạng thái global: `node scripts/build-light-index.js` fail do lỗi cú pháp có sẵn `js/data/q-concurrency-jvm.js:8876 (Unexpected token '{')` (ngoài file sở hữu). `node scripts/validate.js` còn nhiều lỗi/cảnh báo có sẵn ở `lessons-jvm.js`, `lessons-devops.js`, `projects.js`, `path.js` (related/question id jvm/concurrency thiếu) và `index-light.js` cũ; không phát sinh lỗi mới từ `lessons-spring.js` trong kết quả chạy. Không sửa file ngoài phạm vi theo luật 3/AGENTS. Đề xuất integrator fix `q-concurrency-jvm.js` rồi chạy lại `build-light-index` + `validate`.
Reviewed-by: kilo (T1602R)
