# T51 — Nội dung: AWS & AI (đợt 2)

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`, `js/data/q-ai.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `aws`: thêm 6 câu (đang có 16 → mục tiêu ≥ 22)
- API Gateway + Lambda: giới hạn (timeout 29s, payload), REST vs HTTP API, khi nào không hợp
- Step Functions điều phối quy trình nhiều bước, so với Saga tự viết
- Aurora failover và ứng dụng Java: DNS cache của JVM, AWS Advanced JDBC Wrapper, connection pool
- CloudFront + WAF + Shield: cache, chống DDoS và bot cho API công khai
- Kiến trúc multi-account (AWS Organizations, Control Tower, SCP) cho doanh nghiệp/ngân hàng
- Tuân thủ trên AWS (PCI DSS, dữ liệu cư trú tại Việt Nam): shared responsibility, mã hoá, audit với CloudTrail

### topic `ai`: thêm 7 câu (đang có 13 → mục tiêu ≥ 20)
- RAG nâng cao: hybrid search (BM25 + vector), chunking cho tài liệu tiếng Việt, metadata filter
- Fine-tuning vs RAG vs prompt engineering: chọn cái nào cho bài toán nào, chi phí
- Structured output: JSON schema, validate và retry khi model trả sai định dạng trong Java
- Agent đáng tin cậy: giới hạn vòng lặp, budget, human-in-the-loop, xử lý tool lỗi
- Streaming câu trả lời LLM từ Spring Boot tới trình duyệt (SSE), huỷ request, timeout
- Đo chất lượng RAG: faithfulness, answer relevance, context precision/recall, bộ test hồi quy
- Dùng LLM trong ngân hàng: dữ liệu khách hàng, masking PII trước khi gửi, data residency, audit

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
- Hoàn thành bởi agent Claude: sửa aws-017/018 (model free viết sai), thêm aws-019..022, ai-014..020.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
