# T2542 — 2 bài học (ai) vào lessons-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-ai.js`
After: T2541

Thêm **2 bài học mới** (track `ai`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: HANDS-ON (1) Streaming LLM: đọc luồng SSE (dòng event:/data:, dòng trống kết thúc event), ghép text delta, ghép tool-call arguments JSON bị chia thành nhiều mảnh, xử lý stop_reason/finish và lỗi giữa luồng; nối ra trình duyệt bằng SseEmitter/Flux (ở body, minh hoạ). (2) Đo TTFT (time to first token) vs tổng thời gian. Bài tập: SseParser.feed(chunk) trả danh sách event (chunk có thể cắt giữa dòng), StreamAssembler ghép text + tool args — test với chuỗi chunk cắt ở vị trí xấu..

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-ai.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài học mới (nối tiếp lesson-ai-020, order 20):
  - `lesson-ai-021` (order 21, senior, 55') — **Streaming LLM qua SSE**: đọc luồng SSE từng mẩu (event:/data:/dòng trống/[DONE]), bẫy chunk cắt giữa dòng, ghép text delta, ghép tool-call arguments JSON theo index, stop_reason/finish + lỗi giữa luồng, minh hoạ SseEmitter (Spring MVC) và Flux<ServerSentEvent> (WebFlux). 2 bài tập: `SseParser.feed` (8 test) và `StreamAssembler` (7 test).
  - `lesson-ai-022` (order 22, senior, 45') — **Đo TTFT vs tổng thời gian**: phân biệt TTFT/total/throughput, công thức + ví dụ số, vì sao streaming chỉ giảm TTFT, tối ưu đúng chỗ, bẫy đo. 1 bài tập: `StreamMetrics` (12 test).
- Trạng thái file trước khi làm: bị hỏng do lần chạy trước gián đoạn (có object `lesson-ai-015` chèn nhầm vào giữa template `tests` của bài tập lesson-ai-001, và 2 stub `lesson-ai-014`/`lesson-ai-015` duplicate id/order nằm NGOÀI `push()`). Đã khôi phục về baseline commit 74077628 (T2541, 20 bài) rồi mới thêm 2 bài mới; giữ nguyên toàn bộ nội dung cũ.
- Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/test-lessons.js lesson-ai-021` → 2/2, `lesson-ai-022` → 1/1 (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → **0 lỗi ở lessons-ai.js**.
- Lưu ý: `node scripts/validate.js` hiện còn 8 lỗi **ở `js/data/bugs.js` (bug-047, bug-048)** — đây là file của task khác (T2532 java-bugs) đang dở, KHÔNG thuộc T2542 và không có trong baseline. Không sửa vì luật AGENTS.md mục 3 (chỉ sửa file sở hữu).
Reviewed-by: kilo (T2542R)
