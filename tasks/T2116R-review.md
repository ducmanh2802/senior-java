# T2116R — Fact-check nội dung mới của T2116

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2116 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Kiểm tra `git diff HEAD -- js/data/q-concurrency-jvm.js`: thay đổi MỚI của T2116 chỉ là thêm tag `'core'` vào 55 câu (chỉ dòng `tags`, không sửa `q/a/follow/explain`). Không có nội dung kiến thức/markup mới để fact-check.
- `node --check js/data/q-concurrency-jvm.js`: OK.
- `node scripts/validate.js`: không đạt OK do lỗi pre-existing ngoài phạm vi sở hữu (syntax error `js/data/q-microservices.js:1992` gây fail `build-light-index.js`, và nhiều lỗi related id/path/index-light cũ trong lessons-*, projects.js, path.js). Không sửa file ngoài ownership theo luật.
- Kết luận: không có lỗi kiến thức cần sửa trong phạm vi T2116R.
