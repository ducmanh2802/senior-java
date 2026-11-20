# T2545 — 4 câu hỏi Senior Java (ai) vào q-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2491

Thêm **4 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: HANDS-ON viết code thật (mỗi câu có code ≤ 30 dòng chạy được hoặc gần chạy được): (1) Spring AI ChatClient trích xuất dữ liệu từ phiếu bảo trì máy thành record Java (entity()), validate bằng Bean Validation, xử lý khi model trả thiếu field; (2) Khai báo tool bằng @Tool (Spring AI) cho tra tồn kho + kiểm soát quyền theo user đang đăng nhập — vì sao không tin tham số userId do model đưa; (3) pgvector: DDL bảng chunk (vector(1024), metadata jsonb), index HNSW (m, ef_construction), câu SQL top-k có lọc tenant/ngày và cái bẫy filter sau ANN làm thiếu kết quả (ef_search, iterative scan ở pgvector 0.8 — không chắc thì nói ít); (4) Test code gọi LLM: fake ChatModel/WireMock cho unit test, eval set chạy trong CI có ngưỡng, không gọi model thật trong test đơn vị. **Không bịa API**: chỉ dùng class/method Spring AI 1.x / LangChain4j 1.x mà bạn chắc chắn (ChatClient, .prompt().user().call().entity(), @Tool, AiServices…); chỗ không chắc thì viết pseudo-code và ghi rõ "minh hoạ"..

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-ai.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 4 câu hỏi mới vào js/data/q-ai.js: ai-144 (senior, Spring AI ChatClient entity() + Bean Validation + xử lý thiếu field), ai-145 (senior, @Tool + phân quyền, không tin userId từ model), ai-146 (lead, pgvector DDL vector(1024)/metadata jsonb + HNSW m/ef_construction + filter-after-ANN pitfall), ai-147 (senior, unit test LLM-calling code với FakeChatModel/WireMock + eval set CI). Chạy node scripts/build-light-index.js rồi node scripts/validate.js → OK.
Reviewed-by: kilo (T2545R)
