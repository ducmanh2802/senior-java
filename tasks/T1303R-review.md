# T1303R — Fact-check nội dung mới của T1303

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1303 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ diff thêm vào `js/data/q-claude.js` (6 câu hỏi claude-019 → claude-024, mỗi câu thêm phần "Ví dụ đời thực" + "Trả lời miệng 1 phút"). Kết quả: không phát hiện lỗi kỹ thuật, markup hợp lệ, số liệu đã đối chiếu chính xác.

- claude-019 (Agent Skills): thêm Ví dụ đời thực (công ty sản xuất, QA 4 người, 4h → 35 phút, giảm 85%) và Trả lời miệng 1 phút. Đúng cơ chế progressive disclosure, description cụ thể, script tính toán, eval 20/20.
- claude-020 (Enterprise governance): thêm Ví dụ đời thực (tập đoàn bán lẻ 12.000 NV, chi phí 48.000 → 14.000 USD/tháng, giảm 71%) và Trả lời miệng 1 phút. Đúng nguyên tắc bắt đầu đơn giản, gateway tập trung, eval, chính sách dữ liệu, least privilege.
- claude-021 (Agentic loop): thêm Ví dụ đời thực (chatbot treo, agent chạy 147 bước, chi phí $4.50) và Trả lời miệng 1 phút. Đúng stop_reason tool_use, message assistant phải giữ nguyên, tool_result đứng đầu content message user, MAX_STEPS.
- claude-022 (Stop conditions): thêm Ví dụ đời thực (refactor agent, p50 12→7, p95 38→18, chi phí $1.15→$0.42) và Trả lời miệng 1 phút. Đúng Budget theo route, phát hiện lặp, stop_reason handling, effort phù hợp.
- claude-023 (Tool error): thêm Ví dụ đời thực (check_inventory is_error_rate 18%→1.2%, circuit breaker, p95 30s→2.1s) và Trả lời miệng 1 phút. Đúng 3 loại lỗi, is_error có hướng dẫn, retry trong code, idempotency key theo nghiệp vụ.
- claude-024 (Orchestrator–subagent): thêm Ví dụ đời thực (monorepo 200 module, context 400K→8K token, p95 180s→55s, chi phí $2.30→$0.68) và Trả lời miệng 1 phút. Đúng orchestrator–subagent, budget riêng, summary ≤ 500 từ, model rẻ cho subagent.

Lưu ý: validator (`node scripts/validate.js`) hiện còn 2 lỗi ở file `q-microservices.js` (microservices-025.a và microservices-026.a: tiêu đề `###` bị thụt đầu dòng). File này không phải sở hữu của task T1303R, theo AGENTS.md mục 2.3 không tự sửa — đề xuất integrator hoặc task sở hữu file đó sửa.
