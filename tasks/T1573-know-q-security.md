# T1573 — Kiến thức: 8 câu hỏi kinh điển (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý**.

Chủ đề: XSS và cách Spring/Thymeleaf escape, CORS hoạt động thế nào (preflight), session fixation, OAuth2 client credentials cho service-to-service, mTLS, mã hoá dữ liệu nhạy cảm at rest (envelope encryption, KMS), log không lộ dữ liệu nhạy cảm, dependency vulnerability scanning.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-security.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-security.js logs/tmp-T1573.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `security-041`–`security-048`: XSS/Thymeleaf, CORS preflight, session fixation, OAuth2 Client Credentials, mTLS identity/policy, envelope encryption với KMS, logging an toàn và quy trình quét lỗ hổng dependency.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js`; kết quả validate: `OK — không có lỗi.`
Reviewed-by: kilo (T1573R)
