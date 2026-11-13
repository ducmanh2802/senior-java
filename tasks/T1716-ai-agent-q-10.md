# T1716 — AI agent: 6 câu hỏi về MCP và tích hợp công cụ (10)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Thêm **6 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý**.

Chủ đề: MCP là gì và khác gọi function/tool trực tiếp thế nào, khi nào nên viết MCP server cho hệ thống nội bộ, phân quyền và audit khi agent dùng MCP server, thiết kế tool trả về dữ liệu lớn (phân trang, tóm tắt), xử lý tool chậm hoặc lỗi trong vòng lặp agent, version hoá tool mà không làm hỏng agent đang chạy.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

> **Quan trọng:** KHÔNG đọc toàn bộ `js/data/q-ai.js` (file lớn, sẽ hết lượt). Xem danh sách bằng `node scripts/qtool.js list js/data/q-ai.js`, xem một mục mẫu bằng `node scripts/qtool.js show js/data/q-ai.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-ai.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-ai.js logs/tmp-T1716.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu: `ai-109` (senior, MCP vs function calling), `ai-110` (lead, khi nào viết MCP server nội bộ), `ai-111` (senior, phân quyền & audit MCP), `ai-112` (senior, tool trả dữ liệu lớn: phân trang/tóm tắt), `ai-113` (senior, tool chậm/lỗi trong agent loop), `ai-114` (lead, version hoá MCP tool/schema).
- Mỗi câu có **Tóm tắt**, giải thích thuật ngữ, cơ chế từng bước & vì sao, code Java/sơ đồ ~~~seq/~~~json, bảng trade-off, pitfall production, **Ví dụ đời thực** có số liệu, **Trả lời mẫu khi phỏng vấn**, `> Senior tip:`, và `follow` (3 câu). Đúng markup ({{code}}, không backtick, không ${}).
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js sẵn có). Không commit. Temp: `logs/tmp-T1716.js`.
Reviewed-by: kilo (T1716R)
