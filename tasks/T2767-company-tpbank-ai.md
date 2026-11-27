# T2767 — Company pack: TPBank + bộ luyện "AI Engineer ngân hàng" (TPBank, MB, Techcombank, VPBank)

Status: DONE
Agent: kilo
Owns: `js/data/companies.js`

Đọc AGENTS.md trước khi làm. Người dùng yêu cầu: "Tìm JD các job như vậy để luyện tập". Họ vừa thấy tin TPBank tuyển AI Engineer (Chuyên viên cao cấp / Chuyên gia), AI Ops, AI Product Owner, AI Product Manager tại Hà Nội, 15–17 tháng lương/năm. Hồ sơ người dùng: dev Java/Spring Boot 4 năm, đã tích hợp LLM vào Java (failover nhiều AI provider, AI grading, rate limit), vận hành pipeline agent hơn 3.000 task.

## Mục tiêu
Thêm entry `tpbank` vào `js/data/companies.js` theo đúng format các entry ngân hàng có sẵn (`techcombank`, `vpbank`, `mb-bank`: đọc kỹ trước). Nếu các entry đó có chỗ để thêm vai trò AI thì bổ sung phần "AI Engineer" cho chúng (không xoá nội dung cũ).

## Yêu cầu chung của JD AI Engineer ngân hàng (tổng hợp từ tin tuyển dụng công khai 2026, dùng làm khung)
- TPBank: tin Cộng tác viên Prompt Engineer (Khối CNTT) nêu: xây bộ prompt mẫu và tài liệu hướng dẫn cho phòng ban, PoC/demo use case GenAI, chuẩn hoá dữ liệu đầu vào, đánh giá chất lượng đầu ra của model. https://itviec.com/it-jobs/cong-tac-vien-prompt-engineer-khoi-cntt-ngan-hang-tmcp-tien-phong-tpbank-0040
- MB Bank: AI Engineer (Computer Vision/NLP/LLM): LLM pipeline, RAG, AI agent, chatbot, fraud detection, semantic search; Docker, Kubernetes, MLflow, Kubeflow, Triton Inference Server; tối ưu model (pruning, quantization). https://itviec.com/it-jobs/ai-engineer-computer-vision-nlp-llm-mb-bank-1237
- Techcombank: AI Engineer / Manager AI Engineering: AI production-grade, data platform cho ML training và LLM/RAG (cân bằng cost, latency, freshness), A/B test online, hiệu chỉnh đánh giá người + LLM-as-judge; GenAI, RAG, Agentic AI. https://itviec.com/it-jobs/expert-ai-engineer-techcombank-5156
- VPBank: Middle AI Engineer, 3 năm kinh nghiệm, phân tích yêu cầu nghiệp vụ và đề xuất giải pháp GenAI cho hệ thống IT. https://tuyendung.vpbank.com.vn/job/AI-Engineer-H%C3%A0-N%E1%BB%99i-TA174/6380-vi_VN/
Chỉ ghi những gì có trong nguồn; chỗ không chắc ghi "xác nhận lại với JD chính thức". Không bịa mức lương, quy trình phỏng vấn hay tên người.

## Nội dung entry tpbank (và phần AI cho các ngân hàng khác)
1. Tổng quan vị trí AI Engineer / AI Ops ở ngân hàng; khác biệt AI Engineer (xây hệ thống) vs AI Ops (vận hành, giám sát) vs AI PO/PM.
2. Gap analysis cho người dùng: điểm mạnh (Java backend, tích hợp LLM, agent pipeline), điểm thiếu thường gặp (Python, RAG + vector DB, eval, MLOps, bảo mật dữ liệu khách hàng ngân hàng, tuân thủ) và cách lấp trong 4–8 tuần.
3. 25–30 câu hỏi phỏng vấn kèm đáp án mẫu chi tiết, chia nhóm: RAG (chunking, embedding, hybrid search, rerank, đánh giá retrieval), LLM trong production (timeout, retry, fallback provider, cache, chi phí token, streaming), đánh giá (golden set, LLM-as-judge và hiệu chỉnh, A/B test), agent và tool use (giới hạn bước, quyền hạn tool, human-in-the-loop), bảo mật và tuân thủ ngân hàng (PII masking, data residency, prompt injection, audit log, không gửi dữ liệu khách hàng ra model public), MLOps/AI Ops (giám sát drift, latency, chi phí, MLflow, deploy trên Kubernetes), câu hỏi hành vi (STAR) dùng trải nghiệm thật của người dùng.
4. Đề bài system design 2 bài: "Chatbot hỗ trợ khách hàng ngân hàng dùng RAG trên tài liệu nội bộ" và "Hệ thống phát hiện giao dịch bất thường có LLM giải thích lý do", mỗi bài có yêu cầu, ước lượng, kiến trúc, trade-off.
5. Link nguồn (các URL ở trên) để người dùng đọc JD gốc.

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Tiếng Việt có dấu đầy đủ, thuật ngữ kỹ thuật giữ tiếng Anh. Nội dung đúng sự thật, đối chiếu tài liệu chính thức.

## Nghiệm thu
- `node --check js/data/companies.js`; `node scripts/validate.js` → OK.
- Ghi vào Notes: thay đổi, số câu hỏi, lệnh đã chạy và kết quả.

## Notes

- **Thay đổi (chỉ trong `js/data/companies.js`):**
  - Thêm entry mới `tpbank` — "TPBank (AI Engineer / AI Ops)", `type: 'bank'`, chèn ngay sau entry `mb-bank`. Nội dung gồm:
    - `summary` (~4.960 ký tự, markdown): (1) tổng quan 4 vai trò AI ở ngân hàng (AI Engineer vs AI Ops vs AI PO/PM, giải thích thuật ngữ cho người mới, có ví dụ); (2) gap analysis cho hồ sơ người dùng (điểm mạnh Java/LLM/failover/rate limit/3.000 task; điểm thiếu Python, RAG+vector DB, eval, MLOps, bảo mật/tuân thủ, observability + lộ trình lấp 4–8 tuần).
    - `questions`: **28 câu** chia nhóm `[RAG]`, `[LLM production]`, `[Eval]`, `[Agent]`, `[Bảo mật]`, `[AI Ops]`, `[Java/Backend]`, `[System design]`, `[Behavioral]`, `[English]`.
    - `tips` (11 mục): hướng dẫn trả lời mẫu theo từng nhóm + **2 đề system design** (chatbot RAG tài liệu nội bộ; phát hiện giao dịch bất thường + LLM giải thích — có yêu cầu, ước lượng, kiến trúc, trade-off) + senior tip + ghi chú nguồn.
    - `stack`, `process` (5 vòng, ghi rõ là mẫu tham khảo chưa có review công khai TPBank AI), `focus` (ai, security, microservices, design, db, scenario, devops, english, behavioral), `englishRequired: true`, `pay` (15–17 tháng lương/năm theo tin tuyển dụng, không bịa mức/tháng), `sources` (4 link JD gốc), `confidence: 'low'`.
  - Bổ sung phần AI Engineer (không xoá nội dung cũ) cho 3 entry ngân hàng có JD AI công khai: `techcombank` (+1 câu `[AI Engineer]`, +1 tip), `vpbank` (+1 câu, +1 tip), `mb-bank` (+1 câu, +1 tip) — mỗi phần dẫn sang pack TPBank.
- **Không bịa** mức lương/tháng, quy trình phỏng vấn hay tên người; chỗ chưa chắc ghi "xác nhận lại với JD chính thức".
- **Lệnh đã chạy & kết quả:**
  - `node --check js/data/companies.js` → OK (CHECK_OK).
  - `node scripts/build-light-index.js` → "Đã ghi js/data/index-light.js (458.2 KB)" (chạy theo luật 6 vì có thêm công ty; đây là file sinh tự động, không phải file sở hữu).
  - `node scripts/validate.js` → **không in OK vì repo đang có lỗi tồn đọng từ task khác** (lessons-testing.js lỗi cú pháp, path.js thiếu/conflict bài học, quiz-ops.js tiêu đề ###, lessons-jpa body ngắn…). Đã so sánh tập lỗi trước/sau: **không có lỗi nào liên quan `companies.js`/`tpbank`**; số entry = 47, nạp thành công. Các lỗi còn lại thuộc file của task khác (đang được sửa đồng thời), không thuộc phạm vi T2767.
- **Ghi chú cho integrator:** `index-light.js` đã được sinh lại; nếu autopilot không muốn commit file sinh, có thể bỏ qua — dữ liệu công ty trong `companies.js` đã đúng.
Reviewed-by: verify-only (code/UI task)
