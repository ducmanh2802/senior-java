# T2326R — Fact-check nội dung mới của T2326

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2326 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã fact-check toàn bộ 40 câu mới (qz-architecture-021..040, qz-design-051..070). Nội dung kỹ thuật đúng (SRP/OCP/LSP/ISP/DIP, Strategy vs State, Decorator/proxy Spring, record/Builder, Hexagonal ports-adapters, DDD aggregate boundary, code smell, refactor an toàn). Không có API/flag bịa, không có số liệu vô căn cứ, không lẫn chữ nước ngoài.
- Sửa lỗi markup (4 câu `q` dùng {{...}} lồng dấu `{ }` → validate báo "hiển thị sai"): chuyển đoạn code sang code block ~~~java trong `q` cho `qz-architecture-021`, `qz-design-051`, `qz-design-053`, `qz-design-054`. Nội dung câu hỏi giữ nguyên.
- Chỉnh 1 điểm kỹ thuật: `qz-architecture-024` (private @Transactional) — bổ sung "không final" vào giải thích vì CGLIB không override được cả method private lẫn final; không chỉ private. Câu trả lời đúng (B) không đổi.
- `node --check js/data/quiz-design.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → "OK — không có lỗi." (các lỗi q-security.js/q-security-part.js trước đó là file của task khác, đã được xử lý).
- Không sửa nội dung đã có ở HEAD, không thêm/xoá mục, không sửa file ngoài quiz-design.js.
