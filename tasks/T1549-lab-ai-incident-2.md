# T1549 — Debug lab: 2 sự cố hệ thống AI (RAG trả lời sai vì index cũ, provider LLM sập)

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`

Thêm **2 bài debug lab** (category incident, id lab-incident-NNN nối tiếp) theo AGENTS.md mục 10; đọc các bài có sẵn làm mẫu.
(1) Chatbot RAG trả lời theo chính sách đã hết hiệu lực vì pipeline cập nhật index bị lỗi im lặng 3 ngày (artifact: log job embedding, metric số chunk, câu trả lời sai có trích nguồn cũ).
(2) Provider LLM chính trả 529/overloaded trong giờ cao điểm, retry không backoff làm tăng tải và hết budget (artifact: log request, metric tỉ lệ lỗi, config retry).
Artifact tự nhất quán và khớp answer; rubric ≥ 3 ý.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/labs-incident.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/labs-incident.js logs/tmp-T1549.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm `lab-incident-029` (RAG dùng revision chính sách cũ do checkpoint tiến sau lỗi embedding) và `lab-incident-030` (HTTP 529, retry tức thời và budget credit nội bộ).
- Đã chạy `node scripts/build-light-index.js`, `node --check js/data/labs-incident.js`, qtool check cho hai lab và `node scripts/validate.js` — `OK — không có lỗi.`
Reviewed-by: kilo (T1549R)
