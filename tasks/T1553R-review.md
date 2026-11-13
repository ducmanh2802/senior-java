# T1553R — Fact-check nội dung mới của T1553

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-4.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1553 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 14 câu hỏi mới (qz-ccat-028 → qz-ccat-041). Tất cả đúng kỹ thuật:
- Schema hợp lệ: single-choice 4 options, multi-choice 5 options với "(Choose 2)", answer index hợp lệ và tăng dần cho multi.
- Nội dung MCP/Claude API chính xác: tool do app thực thi không phải model, chạy song song khi độc lập kèm tool_result riêng, phân trang server-side, dữ liệu thời gian thực qua tool, readOnlyHint chỉ là hint không phải authorization, MCP initialization negotiate version/capabilities, tools/list_changed notification, resource subscriptions thay polling, async job pattern cho tác vụ lâu, telemetry chỉ metadata + redact sensitive.
- Markup tuân thủ: không backtick, không `${`, không backslash lỗi; dùng đúng **bold**, ### header, - list, > note.
- Ngôn ngữ: câu hỏi tiếng Anh (chuẩn chủ đề CCA-F), giải thích tiếng Việt.
Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK — không có lỗi.
