# T1727 — Kiến thức: 6 câu hỏi bảo mật cho ứng dụng có AI

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý**.

Chủ đề: OWASP Top 10 cho ứng dụng LLM ở mức tổng quan, prompt injection trực tiếp và gián tiếp, rò rỉ dữ liệu qua câu trả lời của model, quản lý API key LLM (không để ở client, xoay vòng), kiểm soát output trước khi thực thi hành động, ghi log an toàn (không lưu dữ liệu nhạy cảm trong prompt).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

> **Quan trọng:** KHÔNG đọc toàn bộ `js/data/q-security.js` (file lớn, sẽ hết lượt). Xem danh sách bằng `node scripts/qtool.js list js/data/q-security.js`, xem một mục mẫu bằng `node scripts/qtool.js show js/data/q-security.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-security.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-security.js logs/tmp-T1727.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu hỏi mới vào `js/data/q-security.js` (nối tiếp id lớn nhất là security-048):
  - **security-049** (senior) — OWASP Top 10 for LLM Applications (bản 2025): tổng quan 10 nhóm rủi ro, bảng tra cứu, guard pipeline Java, ưu tiên theo ngữ cảnh.
  - **security-050** (lead) — Prompt injection trực tiếp vs gián tiếp (qua RAG): sơ đồ ~~~seq, vì sao prompt không vá được, tool least-privilege bằng Java, bảng 6 lớp phòng thủ.
  - **security-051** (senior) — Rò rỉ dữ liệu qua câu trả lời model: 3 đường rò rỉ, retrieval lọc tenant/ACL bằng Java, che PII, kiểm tra trích dẫn.
  - **security-052** (senior) — Quản lý API key LLM: proxy server (sơ đồ ~~~seq), đọc key từ AWS Secrets Manager bằng Java, xoay vòng, quota đa tenant.
  - **security-053** (lead) — Kiểm soát output trước khi thực thi: parse schema + allowlist + authorization + idempotency + xác nhận người thật (Java sealed interface + switch).
  - **security-054** (senior) — Ghi log an toàn cho LLM: bảng nên/không log, structured logging Java chỉ log metadata, kiểm thử sentinel.
- Nội dung không trùng `ai-008`/`ai-035` (bản tóm tắt trong topic ai): ở đây đi sâu kiến trúc backend Java, code, sơ đồ và ví dụ production có số liệu.
- Không backtick, không `${` trong nội dung; mọi seq diagram parse đúng.
- Nghiệm thu: `node scripts/build-light-index.js` (đã chạy) + `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/qtool.js check js/data/q-security.js` → OK. KHÔNG commit.
Reviewed-by: kilo (T1727R)
