# T1600 — Kiến thức: 6 tình huống xử lý sự cố production

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý**.

Chủ đề: CPU 100% sau deploy, latency p99 tăng dần theo ngày (memory/GC), DB connection pool cạn lúc cao điểm, Kafka consumer lag tăng không giảm, deploy làm mất dữ liệu cache gây thundering herd, lỗi chỉ xảy ra ở một pod (cấu hình/node).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-scenario.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-scenario.js logs/tmp-T1600.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu hỏi (id nối tiếp sau `scenario-130`): `scenario-131` (CPU 100% sau deploy), `scenario-132` (p99 tăng dần theo ngày do memory/GC), `scenario-133` (HikariCP connection pool cạn lúc cao điểm), `scenario-134` (Kafka consumer lag tăng không giảm — level lead), `scenario-135` (deploy mất cache gây thundering herd), `scenario-136` (lỗi chỉ xảy ra ở một pod do node/config — level lead).
- Thêm bằng `node scripts/qtool.js append js/data/q-scenario.js logs/tmp-T1600.js`; không sửa nội dung cũ.
- Mỗi đáp án có **Tóm tắt:**, cơ chế từng bước + vì sao, code Java/YAML hoặc sơ đồ `~~~seq`, bảng trade-off, pitfall production, **Ví dụ đời thực** có số liệu, **Trả lời mẫu khi phỏng vấn**, `> Senior tip:`; `follow` 3 câu.
- `node scripts/build-light-index.js` → đã ghi lại `js/data/index-light.js` (267.8 KB).
- `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/qtool.js check js/data/q-scenario.js` → OK.
- Không chạy git commit.
Reviewed-by: kilo (T1600R)
