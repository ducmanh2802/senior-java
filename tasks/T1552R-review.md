# T1552R — Fact-check nội dung mới của T1552

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-3.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1552 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Kiểm tra 15 câu hỏi mới (qz-ccap-031 → qz-ccap-045) về mặt kiến thức: tất cả đều đúng (system parameter, temperature, max_tokens, stop_sequences, top_p, tool use, prompt caching, extended thinking, Claude Code, context window, prompt injection, MCP, Batches API, vision, rate limits). Answer index, multi flag, explain đều chuẩn. Không có lỗi.
- `node scripts/validate.js` → OK — không có lỗi.
- `node scripts/build-light-index.js` → OK (sinh lại index-light.js).
