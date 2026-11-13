# T1575 — Kiến thức: 8 câu hỏi kinh điển (testing) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: testing) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý**.

Chủ đề: unit vs integration vs e2e ranh giới, @SpringBootTest vs slice test (@WebMvcTest, @DataJpaTest), Testcontainers chi phí và tăng tốc, test dữ liệu thời gian (Clock), mutation testing, test flaky do thứ tự/thời gian (topic: testing).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-soft.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-soft.js logs/tmp-T1575.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 8 câu testing mới vào `js/data/q-soft.js` (append bằng `qtool.js`): `testing-049` (senior, ranh giới unit/integration/E2E), `testing-050` (senior, @SpringBootTest vs @WebMvcTest/@DataJpaTest), `testing-051` (senior, chi phí & tăng tốc Testcontainers), `testing-052` (mid, test thời gian với java.time.Clock), `testing-053` (senior, mutation testing/PIT), `testing-054` (senior, flaky do thứ tự/shared state), `testing-055` (senior, điều tra flaky do thời gian/Awaitility/Clock), `testing-056` (lead, chiến lược tổ chức xử lý flaky/quarantine/flake rate).
- Mỗi câu có `**Tóm tắt:**`, giải thích thuật ngữ lần đầu, cơ chế từng bước, ví dụ code Java/bảng trade-off, lỗi hay gặp, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:` và `follow` 2–3 câu. Không backtick, không `${` trong nội dung.
- Sửa 1 lỗi validator phát hiện sau append: inline code lồng `{ }` trong testing-052 (`@Bean Clock clock() { return Clock.systemUTC(); }`) được viết lại thành mô tả text (dòng ~6543).
- `node scripts/build-light-index.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo có sẵn ở q-api.js và path.js, không thuộc file sở hữu). Không commit.
Reviewed-by: kilo (T1575R)
