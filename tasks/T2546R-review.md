# T2546R — Fact-check nội dung mới của T2546

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2546 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 4 câu mới của T2546 (ai-148, ai-149, ai-150, ai-151). Nội dung kỹ thuật tổng thể ĐÚNG (công thức token/chi phí ai-149 tính số khớp; số liệu latency ai-151 cộng đúng 7.900 ms và ~2.200 ms; Anthropic prompt caching 1,25×/0,1× ai-149 đúng; vLLM/TGI, PrivateLink, TF-IDF+SVM, macro-F1 ai-150 đúng).

Lỗi đã sửa (đều là API Spring AI bịa/sai phiên bản — dùng API pre-1.0 đã bị remove):
- ai-148: đổi `SearchRequest.query(...).withTopK(...)` (2 chỗ: tầng 2 và tầng 3) sang builder của Spring AI 1.0 GA: `SearchRequest.builder().query(...).topK(...).build()`. Lý do: `SearchRequest.query(String)` và `withTopK(int)` bị `@Deprecated(forRemoval=true)` từ 1.0.0-M5 và bị bỏ ở 1.0 GA; code hiện có trong repo (q-ai.js:2812) đã dùng builder → giữ đúng chuẩn.
- ai-151: đổi `SearchRequest.query(rewritten).withTopK(10)` (1 chỗ, trong code đo song song) sang `SearchRequest.builder().query(rewritten).topK(10).build()`.

Không sửa gì khác (không đổi văn phong/độ dài/bố cục, không thêm/xoá mục). Đã kiểm: không còn `withTopK`/`SearchRequest.query` trong file. Các API còn lại (ChatClient `.prompt().user().call().content()/.chatResponse()/.stream().content()`, `response.getMetadata().getUsage()`, LangChain4j `tokenUsage()`, Micrometer `meter.counter(...).increment(...)`) đều đúng.

Nghiệm thu:
- `node --check js/data/q-ai.js` → OK.
- `node scripts/qtool.js check js/data/q-ai.js` → "OK for q-ai.js".
- `node scripts/validate.js`: q-ai.js KHÔNG còn lỗi/cảnh báo nào. Các lỗi còn lại thuộc file KHÁC (không sở hữu, luật 3): lessons-ai.js (lỗi cú pháp "Unexpected token ':'" — WIP của task khác), quiz.js (qz-ai-022 field "level"), bugs.js (bug-047/048 chưa hoàn thiện), projects.js, path.js, và index-light.js báo cũ (hệ quả của lessons-ai.js lỗi cú pháp + WIP của agent khác; index-light.js do integrator sở hữu, không tự sinh lại). Vì vậy validate toàn cục chưa in "OK — không có lỗi." cho tới khi chủ các file đó hoàn thiện.
- Không chạy test-lessons.js (file này là câu hỏi tự luận, không có bài học/bài tập).
- Không commit (đúng luật 4).
