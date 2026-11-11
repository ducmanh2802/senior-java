# T1331R — Fact-check nội dung mới của T1331

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1331 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check nội dung mới (6 đoạn "Ví dụ đời thực" thêm vào behavioral-019, behavioral-020, testing-017, testing-024, behavioral-021, behavioral-022):

- Không có lỗi kiến thức, markup, hay chữ nước ngoài lẫn vào trong file `js/data/q-soft.js`.
- `node scripts/validate.js` không báo lỗi gì thuộc q-soft.js. Các lỗi còn lại (labs-incident.js, lessons-*.js, projects.js, q-devops.js, path.js, index-light.js) đều nằm trong file của các task khác, không phải quyền sở hữu của T1331R.
