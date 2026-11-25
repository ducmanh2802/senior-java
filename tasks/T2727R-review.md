# T2727R — Fact-check nội dung mới của T2727

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2727 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- english-251: sửa số liệu không nhất quán — cache được giới hạn 50.000 entries nhưng đáp án nói "stayed under sixty thousand entries" → "around fifty thousand entries".
- english-252, english-253, english-254: không có lỗi kỹ thuật/markup (Kafka 3.x, PostgreSQL, Hibernate 6/JOIN FETCH/@EntityGraph, Spring Boot 3, EKS multi-AZ; số liệu là ví dụ STAR minh họa, không bịa API/flag; markup hợp lệ, không backtick/`${`; 3 follow-up; id 251–254 tăng dần; lang: 'en').
- validate.js: q-english.js không bị báo lỗi. Các lỗi còn lại (lessons-modern.js cú pháp, quiz-ops.js markup ###, index-light.js cũ…) nằm ngoài file sở hữu của task; `node scripts/build-light-index.js` bị sập trên lessons-modern.js (file khác sở hữu, tuân thủ quy tắc 3 → không sửa) nên không thể sinh lại index-light.js.
