# T1594R — Fact-check nội dung mới của T1594

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-5.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1594 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review 8 câu mới qz-ccafive-036…043 (topic 'claude', tag [Context Management]) do T1594 thêm:
- Kỹ thuật: đúng (tool result stale phiên dài 036; ràng buộc nguyên văn khi compact 037; prefix cache đa khách hàng 038 multi; bàn giao ca sự cố 039; auto memory không overrides CLAUDE.md 040; bảo trì system prompt/quy tắc lỗi thời 041; lọc tool_result tránh lộ bí mật 042; cache schema MCP TTL/hủy cache 043). Không bịa API/số liệu/flag.
- Markup: không backtick trong nội dung, không `${`, `node --check` OK.
- Schema: `node scripts/validate.js` → OK — không có lỗi.
Không có lỗi kiến thức → không sửa nội dung, không thêm/xoá mục, không chỉnh văn phong.