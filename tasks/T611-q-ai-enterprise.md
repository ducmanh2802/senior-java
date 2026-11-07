# T611 — 10 câu: ứng dụng AI trong doanh nghiệp (góc nhìn Java dev)

Status: DONE
Notes: Added ai-030..ai-039 (10 questions). node --check js/data/q-ai.js OK. validate.js reports pre-existing syntax error in js/data/quiz.js (not owned) unrelated to this task.
Agent: kilo
Owns: `js/data/q-ai.js`

Thêm 10 câu topic ai, level mid/senior/lead (khoảng 2/6/2), về **AI được dùng thật trong doanh nghiệp** và vai trò của Java backend dev. Mỗi câu mở bằng một bối cảnh doanh nghiệp cụ thể (ngân hàng, bảo hiểm, thương mại điện tử, viễn thông). Gợi ý (chọn cái chưa có trong q-ai.js):
- Chatbot CSKH ngân hàng dùng LLM + RAG trên tài liệu sản phẩm: kiến trúc, khi nào chuyển cho nhân viên, không được tự trả lời số dư/giao dịch nếu chưa xác thực.
- Trích xuất dữ liệu từ giấy tờ (eKYC, hồ sơ bồi thường bảo hiểm, hoá đơn): OCR + LLM structured output, kiểm tra lại bằng rule, human-in-the-loop.
- AI hỗ trợ lập trình trong công ty lớn (Copilot/Claude Code): chính sách mã nguồn, review code AI viết, đo năng suất, rủi ro license/secret.
- Tích hợp LLM vào service Spring Boot (Spring AI / gọi API trực tiếp): timeout, retry, circuit breaker, streaming, chi phí token, cache.
- Bảo mật & tuân thủ: PII masking trước khi gửi model, data residency, prompt injection từ tài liệu, audit log, model chạy on-prem vs cloud (Bedrock/Azure OpenAI).
- Đánh giá chất lượng (eval) và giám sát AI trên production: bộ test câu hỏi vàng, LLM-as-judge, theo dõi hallucination, A/B.
- Agent tự động hoá nghiệp vụ nội bộ (tạo ticket, tra cứu đơn hàng) bằng tool calling/MCP: phân quyền, giới hạn hành động, xác nhận của người.
- Phát hiện gian lận / chấm điểm tín dụng: ML truyền thống vs LLM, Java service gọi model serving, giải thích được (explainability) cho kiểm toán.
- Tính chi phí và ROI một tính năng AI: ước lượng token, chọn model nhỏ/lớn, batch, khi nào KHÔNG nên dùng AI.
- Tóm tắt cuộc gọi/biên bản và phân loại ticket tự động: pipeline bất đồng bộ (Kafka), xử lý lỗi, độ trễ chấp nhận được.

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-ai.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-ai.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
Reviewed-by: kilo (T611R)
