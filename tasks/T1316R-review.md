# T1316R — Fact-check nội dung mới của T1316

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1316 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review toàn bộ nội dung mới của T1316 trong `js/data/q-soft.js` (6 câu behavioral-013 → behavioral-018; các section mới thêm: ### Ví dụ đời thực, ### Trả lời mẫu khi phỏng vấn, > Senior tip).
- Không tìm thấy lỗi kỹ thuật (API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup (không backtick, không `${`, cú pháp `###`/`{{code}}`/`>` hợp lệ), hay chữ nước ngoài lẫn vào (thuật ngữ kỹ thuật giữ nguyên tiếng Anh theo quy ước).
- `node --check js/data/q-soft.js`: OK. `node scripts/validate.js` không báo lỗi nào liên quan đến q-soft.js.
- `validate.js` tổng thể vẫn LỖI do file KHÔNG thuộc nhiệm vụ này: `q-devops.js` (syntax error: backtick trong template literal, dòng 3038) và `lessons-devops.js` (related id không phải câu hỏi thật). Đã để nguyên theo luật 3 AGENTS.md (chỉ sửa file sở hữu), đề xuất integrator sửa trước khi merge.
