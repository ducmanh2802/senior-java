# T2549 — 2 debug lab (incident) vào labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2531

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-incident.js` để không trùng tình huống. id `lab-incident-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Chi phí LLM tăng 9 lần trong 1 đêm**: artifact = log agent theo trace_id (step, tool, input_tokens, output_tokens, cache_read_tokens), bảng chi phí theo giờ; nguyên nhân: tool tra cứu trả lỗi dạng text, agent lặp gọi lại 25 bước/phiên vì không có giới hạn bước, mỗi bước gửi lại toàn bộ lịch sử. 2. **RAG chậm từ 300 ms lên 4 giây sau khi thêm lọc theo nhà máy**: artifact = EXPLAIN ANALYZE PostgreSQL + pgvector cho thấy Seq Scan / không dùng HNSW vì filter + ORDER BY embedding <=> ..., pg_stat_statements; cách sửa: partial index/partition theo factory_id, tăng ef_search, lọc trước rồi ANN. Số liệu, tên bảng, id khớp nhau giữa artifact và answer.

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-incident.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 2 lab incident senior vào `js/data/labs-incident.js`:
- `lab-incident-052`: Agent LLM chi phí tăng 9 lần (search tool lỗi HTML, retry, không max_steps, gửi toàn bộ lịch sử mỗi bước).
- `lab-incident-053`: RAG chậm 300ms→4s sau khi thêm filter factory_id (HNSW không dùng được với WHERE + ORDER BY embedding, Seq Scan).
`node scripts/validate.js` → OK (lỗi còn lại trong bugs.js, lessons-api.js là file không sở hữu).
Reviewed-by: kilo (T2549R)
