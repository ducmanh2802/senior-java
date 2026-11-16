# T2178R — Fact-check nội dung mới của T2178

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccap-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2178 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-check diff T2178 (qz-ccap-056..085, 30 câu mới) trong `js/data/quiz-ccap-1.js`: không phát hiện lỗi kỹ thuật API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ, lỗi markup, hay chữ nước ngoài lẫn sai. Không sửa nội dung.
- Kiểm tra: `node --check js/data/quiz-ccap-1.js` OK. `node scripts/validate.js` vẫn FAIL toàn cục do lỗi pre-existing ngoài phạm vi sở hữu (vd: `q-claude.js` lỗi cú pháp, `lessons-claude.js`/`projects.js`/`path.js` related refs thiếu, `index-light.js` cũ) — không thuộc `js/data/quiz-ccap-1.js`, không sửa theo luật task. Không có lỗi nào được báo cho file sở hữu.
