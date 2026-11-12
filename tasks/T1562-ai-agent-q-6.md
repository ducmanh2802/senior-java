# T1562 — AI agent: 6 câu hỏi về prompt và structured output trong Java (6)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T1544

Thêm **6 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: thiết kế prompt cho tác vụ trích xuất dữ liệu có schema, validate và retry khi model trả JSON sai, few-shot vs fine-tuning cho tác vụ phân loại, versioning prompt và rollout an toàn, streaming kết quả dài về client Java, đo và giảm độ trễ (time to first token).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1562.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `ai-083`–`ai-088` về prompt trích xuất theo schema, parse/validate/retry, few-shot vs fine-tuning, versioning/rollout, streaming và TTFT.
- Đã chạy `node scripts/build-light-index.js`; `node scripts/validate.js` kết thúc với `OK — không có lỗi.`
Reviewed-by: kilo (T1562R)
