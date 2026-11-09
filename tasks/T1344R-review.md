# T1344R — Fact-check nội dung mới của T1344

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1344 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Validation script không báo lỗi nào cho q-remote.js. Các câu hỏi mới (remote-037 đến remote-066) đúng kỹ thuật về: Java 17/21 features, Spring Boot 3, Spring AI/LangChain4j/RAG, bảo mật (IDOR, injection, secret, AuthN/AuthZ), hiệu năng (N+1, p95, index, cache), toàn vẹn dữ liệu (transaction, idempotency, constraint), freelance terms (retainer, SOW, milestone, change request, Net 30/15, deposit), Upwork cơ chế (Connects, JSS, escrow, invite, client filter). Không có backtick/${}/HTML thô/ký tự CJK/thụt lề ### trong nội dung mới.
