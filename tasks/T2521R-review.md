# T2521R — Fact-check nội dung mới của T2521

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2521 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review 6 câu hỏi mới (behavioral-064 → behavioral-069): không có lỗi kiến thức (heuristic estimate/PIP/delegation/code-review/onboarding/90-đ ngày, không dùng API/SDK bịa, số liệu đều là ví dụ trong case study), markup OK (`{{code}}`, `~~~`, bảng hợp lệ), không chữ nước ngoài lẻn ngoài thuật ngữ kỹ thuật. `node --check js/data/q-soft.js` OK; `node scripts/build-light-index.js` đã chạy. Lỗi còn lại của validate (q-sql-extra.txt, q-frontend.js, lessons-microservices-026 seq) nằm ngoài file sở hữu, không đụng.
