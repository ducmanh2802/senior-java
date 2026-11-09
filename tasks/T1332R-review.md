# T1332R — Fact-check nội dung mới của T1332

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1332 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- claude-031 (few-shot/prefill): đã xoá số liệu/model ID/cờ API/chuỗi lỗi không thể chứng thực (claude-4-sonnet-20250514, useStructuredOutputs, output_config.format, "Prefill is not supported on this model", tỉ lệ 100%/96%, p95 1.8s→1.2s) trong phần "Ví dụ đời thực"; điều chỉnh "Trả lời mẫu" cho nhất quán (model mới thay vì Claude 4). Nội dung cốt lõi giữ: prefill thay đổi giữa thế hệ model → phải chạy eval migration trước khi nâng cấp model production.
- claude-032 (prompt chaining/tài liệu dài): đã thay các con số không căn cứ (120K token, 15%, recall 72%→91%, $8→$5.2, 45s→28s…) bằng mô tả chất lượng; giữ cấu trúc triệu chứng → điều tra → nguyên nhân → cách xử lý → kết quả.
- claude-033 (quản lý context agent): đã xoá tên cờ beta bịa (clear_tool_uses_20250919, context-management-2025-06-27) và các con số không căn cứ (200 lượt/ngày, 18%, 850K token, $12→$0.6, 1/20 token).
- claude-034 (indirect prompt injection): đã sửa thẻ HTML thô `<div style="display:none">…</div>` trong "Ví dụ đời thực" (validate.js báo "có thẻ HTML thô"); mềm mại hóa con số sàng lọc (~300ms, 95%, $0.02/ticket).
- claude-035 (least privilege): mềm mại hóa kết quả đo được (giảm 40%, <5ms).
- claude-036 (PII/secrets): mềm mại hóa overhead masking (~2ms).
- Không sửa nội dung đã có ở HEAD (claude-037…042 giữ nguyên). Không thêm/xoá mục.
- `node --check js/data/q-claude.js` OK; `node scripts/validate.js` → OK — không có lỗi (cảnh báo path.js là của integrator, không liên quan file này).