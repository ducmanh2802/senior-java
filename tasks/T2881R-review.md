# T2881R — Fact-check nội dung mới của T2881

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2881 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 4 câu hỏi mới (ai-161, ai-162, ai-163, ai-164):
- ai-161: Online RAG eval với implicit feedback, reference-free metrics (faithfulness, citation accuracy, retrieval coverage), drift detection qua KS test, canary index — kỹ thuật đúng.
- ai-162: Phòng thủ indirect prompt injection 3 lớp (ingest sanitization, instruction hierarchy, dual-model architecture) — kiến trúc đúng, delimiter escaping đã đề cập.
- ai-163: FinOps LLM phân cấp (org→team→user), atomic Redis Lua quota, EWMA/KS/Isolation Forest anomaly, Prophet forecast, policy engine YAML versioned — đúng kỹ thuật.
- ai-164: LLM-as-judge calibration với Cohen's kappa, position bias mitigation (hoán vị vị trí), binary rubric, JSON output — phương pháp thống kê và code mẫu đúng.
Validator `node scripts/validate.js` không báo lỗi cho 4 câu hỏi này. Không có lỗi kiến thức, markup, hay từ ngữ lẫn lộn. Ghi nhận: **không có lỗi**.
