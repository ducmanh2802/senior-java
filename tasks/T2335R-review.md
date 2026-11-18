# T2335R — Fact-check nội dung mới của T2335

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ccdv-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2335 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- qz-ccdv-151 → qz-ccdv-180 (30 câu): Kiểm tra kỹ thuật đúng hoàn toàn, nhất quán với quiz-claude.js / q-claude.js / lessons-claude.js. Không có lỗi kiến thức.
- Sửa 4 option có space thừa đầu dòng: qz-ccdv-159 (option 2–4), qz-ccdv-165 (option 1–3).
- Không có lỗi markup, không có ký tự lạ, không có `${`/backtick, validate OK, đã chạy build-light-index.js.
