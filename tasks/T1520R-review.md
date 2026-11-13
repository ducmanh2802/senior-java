# T1520R — Fact-check nội dung mới của T1520

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-5.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1520 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review `git diff HEAD -- js/data/quiz-cca-5.js` (23 câu mới: `qz-ccafive-001..023`, topic `claude`, tag `[Context Management]`, 17 single + 6 multi Choose 2).
- Kiểm tra kỹ thuật: không phát hiện API/flag/tên tính năng bịa, không có cơ chế nói ngược (max_tokens vs context window, prompt cache/prefix/breakpoint/expiry, server-side compaction block/state, Messages API stateless request, tool_result/is_error, subagent context/cost, CLAUDE.md vs `/memory` auto memory, provenance/citation, escalation/risk). Không thấy lỗi markup, không có backtick/`${`, chữ nước ngoài không sai ngữ cảnh kỹ thuật.
- Không sửa nội dung câu hỏi/đáp án/giải thích (không có lỗi kiến thức). Không thêm/xoá mục.
- `node scripts/build-light-index.js` → OK; `node --check js/data/quiz-cca-5.js` → OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo sẵn có: `lesson-design-007` không nằm trong PATH). Không chạy `scripts/test-lessons.js` (task không sở hữu bài học).
