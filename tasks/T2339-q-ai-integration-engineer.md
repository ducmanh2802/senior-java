# T2339 — 8 câu phỏng vấn vị trí AI Integration Engineer (Java backend + LLM)

Status: DONE
Agent: kilo
Owns: `js/data/q-ai.js`
After: T2245

## Bối cảnh
Người học (Java dev 4 năm) nhắm vị trí **AI Integration / Applied AI Engineer** ở doanh nghiệp (ngân hàng, bảo hiểm, outsource cho khách Nhật/Mỹ): đưa LLM vào hệ thống Java sẵn có. Đọc AGENTS.md mục 4–6; `node scripts/qtool.js list js/data/q-ai.js` và `node scripts/qtool.js list js/data/q-claude.js` để KHÔNG trùng ý.
> Lần 1 (17:39) agent đã GHI ĐÈ file task này bằng kế hoạch riêng và không thêm câu nào. KHÔNG sửa phần đặc tả; chỉ sửa dòng Status và ghi vào Notes.

## Việc cần làm
Thêm 8 câu (topic theo file, id tiếp số LỚN NHẤT; 2 mid / 4 senior / 2 lead), đúng chuẩn mục 6 (Tóm tắt, ### cơ chế, ví dụ Java ≤30 dòng, ### Ví dụ đời thực có số liệu, ### Trả lời mẫu khi phỏng vấn 150–220 từ, > Senior tip:, 3000–5000 ký tự), có `~~~seq` cho luồng nhiều bên:
1. Chatbot trả lời từ tài liệu nội bộ ngân hàng: RAG end-to-end (ingest, chunking, embedding, pgvector, phân quyền theo tài liệu, trích nguồn).
2. Chứng minh chatbot "đủ tốt" để go-live: bộ eval có nhãn, metric (groundedness, accuracy), ngưỡng, human review.
3. Hallucination trên production: phát hiện, giảm thiểu (grounding, từ chối khi thiếu nguồn, structured output), xử lý khiếu nại.
4. Dữ liệu cá nhân/bí mật khi dùng LLM bên ngoài: che PII, data residency, API trực tiếp vs qua cloud provider trong VPC, log an toàn.
5. Tích hợp LLM vào luồng nghiệp vụ (phân loại email khiếu nại → ticket): async qua Kafka, idempotency, human-in-the-loop khi độ tin cậy thấp.
6. Agent gọi tool có side effect: phân quyền, xác nhận, giới hạn bước, audit.
7. (lead) Ước lượng và kiểm soát chi phí LLM cho 50.000 request/ngày.
8. (lead) Thuyết phục stakeholder: use case đầu tiên, PoC → pilot → production, rủi ro và KPI.
Không bịa tên tham số API, giá, tên model cụ thể.

## Luật
Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá câu cũ, không backtick, không ký hiệu đô-la + ngoặc nhọn. Không commit. Ghi số id trước/sau vào Notes (phải +8).

## Nghiệm thu
`node --check js/data/q-ai.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes

## Notes
Added ai-126..ai-133 (8 questions).
