# T1543 — AI agent: 6 câu hỏi về guardrails và đánh giá (4)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: guardrails cho agent (validate input/output, giới hạn hành động, allowlist tool), đánh giá trước khi release (golden set, A/B prompt), xử lý hallucination trong câu trả lời có trích dẫn, giới hạn chi phí theo user/tenant, cache câu trả lời LLM (semantic cache) và rủi ro, thiết kế fallback khi model chính lỗi.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1543.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm ai-071→ai-076 về guardrails và allowlist tool, golden set/A-B prompt, kiểm chứng citation, quota nguyên tử theo user/tenant, semantic cache an toàn và fallback theo capability. Đã chạy `node scripts/build-light-index.js`, `node --check js/data/q-ai.js`, `node scripts/qtool.js check js/data/q-ai.js ai-071 ai-072 ai-073 ai-074 ai-075 ai-076` và `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: kilo (T1543R)
