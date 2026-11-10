# T1266R — Fact-check nội dung mới của T1266

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1266 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi sửa: chỉ 6 mục mới do T1266 thêm vào `q-ai.js` (ai-001..ai-006, thấy trong diff HEAD: thêm `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn`). Không chạm nội dung ai-001..ai-006 cũ trước đó và ai-007+.
- ai-001: sửa lỗi chính tả/tiếng lạ và số liệu mơ hồ ("katalog" → "danh mục"; "15 lan cuộn" → "khoảng 15% lượt hỏi"; "gửi 12000 token" mâu thuẫn context window 8000 → "gửi khoảng 12000 token" kèm giải thích context window gồm đầu vào+đầu ra); bổ sung giải thích thuật ngữ lần đầu (tokenizer, context window, RAG, latency, transcript) theo đúng đối tượng người đọc.
- ai-002: phần mới không có lỗi kỹ thuật/API bịa; giữ nguyên nội dung kỹ thuật (Spring AI ChatClient, BeanOutputConverter, LangChain4j AiServices) — phù hợp hướng dẫn hiện hành. Không chỉnh.
- ai-003: sửa "dam phan trăm" (lỗi đánh máy, tiếng lạ) → "10-20%"; giải thích rõ các thuật ngữ lần đầu (RAG/Retrieval-Augmented Generation, index, chunk, re-ranking, metadata, heading, embedding/ingestion, vector store, hybrid search, fine-tune). Cơ chế RAG 6 bước đúng.
- ai-004: sửa "artefact" (tiếng nước ngoài lẫn không cần thiết) → "thành phần (artifact)"; đổi `system-v2.txt` thành `{{system-v2.txt}}` để render inline-code đúng markup; giải thích parser/diff/rollback/golden set/feature flag/changelog/eval. Nội dung kỹ thuật (schema, Jackson validation, versioning, trace ID) đúng.
- ai-005: giải thích tool calling, agent, MCP (Model Context Protocol), dry-run, audit log, prompt injection. Cơ chế mô tả đúng (model chỉ trả tên tool + tham số, app thực thi; MCP là giao thức chuẩn). Sửa en dash trong tip thành `-` cho nhất quán. Không có API bịa.
- ai-006: sửa "dasar tham chiếu" (tiếng lạ) → "baseline (mức tham chiếu)"; sửa "cas" → "trường hợp"; chuẩn hóa số ("ba điểm tám" → "3,8", "năm phan trăm" → "5%"); bọc `{{recall@k}}` đúng markup; giải thích golden dataset, rubric, regression test, metric/recall@k/faithfulness, CI, merge, offline eval, edge case. Metric mô tả hợp lý.
- Kiểm tra tự động: `node --check js/data/q-ai.js` OK; script Node kiểm tra targeted: 52 câu ai-* load OK, không thiếu mục "Ví dụ đời thực"/"Trả lời mẫu", không backtick, không `${` chưa escape, không câu < 1500 ký tự.
- `node scripts/build-light-index.js` và `node scripts/validate.js` KHÔNG thể về OK do lỗi PRE-EXISTING ngoài phạm vi sở hữu (không do tôi tạo/sửa): `q-microservices.js` đang modified trong workspace có lỗi cú pháp `Unexpected identifier 'kubectl'` → build-light-index fail và validate báo lỗi cú pháp q-microservices + chuỗi lỗi tham chiếu microservices-* ở bugs/lessons/projects/path (vì microservices=0 câu). Tôi không sở hữu và không được sửa các file đó (luật 3). Không có lỗi nào trỏ tới `q-ai.js`.
- File thay đổi (chỉ owned): `js/data/q-ai.js`, `tasks/T1266R-review.md`.
