# T2546 — 4 câu hỏi Senior Java (ai) vào q-ai.js

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2545

Thêm **4 câu hỏi phỏng vấn mới** (topic: ai) vào `js/data/q-ai.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-ai.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: HANDS-ON tình huống debug & vận hành: (1) Chatbot RAG trả lời sai — quy trình debug từng bước: xem câu hỏi đã rewrite, top-k chunk lấy được, điểm similarity, chunk đúng có trong index không, prompt cuối gửi đi; bảng triệu chứng → nguyên nhân; (2) Tiếng Việt tốn token hơn tiếng Anh: ước lượng chi phí trước khi build (số request × token in/out × giá), cách đo token thật từ usage trả về, giảm chi phí; (3) Áp dụng AI trong NHÀ MÁY (bối cảnh FDI/Samsung): RAG trên SOP/hướng dẫn máy, phân loại mô tả lỗi QC thành mã lỗi, tóm tắt ca trực — chọn prompt / RAG / fine-tune / ML cổ điển cho từng việc, dữ liệu không được ra ngoài (self-host vs Bedrock); (4) Giảm latency chatbot từ 8 giây xuống 2 giây: đo từng chặng (embedding, retrieval, LLM TTFT, generation), streaming, model nhỏ cho bước rewrite, cache, song song hoá. **Không bịa API**: chỉ dùng class/method Spring AI 1.x / LangChain4j 1.x mà bạn chắc chắn (ChatClient, .prompt().user().call().entity(), @Tool, AiServices…); chỗ không chắc thì viết pseudo-code và ghi rõ "minh hoạ"..

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
- Đã thêm 4 câu: `ai-148` (senior — debug chatbot RAG trả lời sai: rewrite → top-k/điểm similarity → chunk vàng trong index → prompt cuối, kèm bảng triệu chứng → nguyên nhân), `ai-149` (senior — token tiếng Việt, công thức ước lượng chi phí, đo usage, 8 cách giảm chi phí), `ai-150` (lead — AI trong nhà máy FDI: RAG SOP, ML cổ điển cho QC, prompt cho tóm tắt ca, self-host vs cloud), `ai-151` (senior — giảm latency chatbot 8s → 2s, đo từng chặng/TTFT, ngân sách latency, streaming/cache/song song).
- Trước khi thêm: 147 câu (ai-001…ai-147). Sau khi thêm: 151 câu, không mất mục nào; chỉ append, không sửa nội dung cũ (chỉ sửa 2 số liệu trong chính 2 câu mới).
- `node --check js/data/q-ai.js` OK; `node scripts/qtool.js check js/data/q-ai.js` → OK for q-ai.js; `node scripts/build-light-index.js` đã chạy lại (387.4 KB).
- `node scripts/validate.js`: **không còn lỗi nào thuộc q-ai.js**. Toàn bộ lỗi còn lại nằm ở `js/data/bugs.js` (bug-047, bug-048: story/fix/hints/artifacts chưa hoàn thiện) — file của task khác (T2532, đã DONE) đang có trong working tree; theo luật 3 tôi không sửa file mình không sở hữu. Vì vậy validate toàn cục chưa in ra `OK — không có lỗi.` cho tới khi chủ file bugs.js hoàn thiện 2 bài đó.
Reviewed-by: kilo (T2546R)
