# T2522R — Fact-check nội dung mới của T2522

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2522 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review 5 câu hỏi mới (behavioral-070 đến behavioral-074):
- behavioral-070: DORA metrics, bug escape rate, team productivity — đúng kỹ thuật, markup hợp lệ
- behavioral-071: Failure story Redis cache missing TTL — đúng kỹ thuật, markup hợp lệ
- behavioral-072: Negotiating scope with Korean/Japanese clients — đúng văn hóa/soft skills, markup hợp lệ
- behavioral-073: Coding vs management balance (20-40%) — đúng industry standard, markup hợp lệ
- behavioral-074: Lead motivation & weakness with mitigation — đúng leadership principles, markup hợp lệ

Không phát hiện lỗi kỹ thuật, lỗi markup, hay từ ngữ nước ngoài không phù hợp. Các thuật ngữ tiếng Anh (DORA, MTTR, RCA, TTL, cache-aside, consensus, pair programming, bottleneck, 1:1) là thuật ngữ chuẩn ngành, giữ nguyên đúng.

Validator không báo lỗi cho 5 câu hỏi này. Lỗi validator hiện tại thuộc file khác (lessons-microservices.js, projects.js, path.js) — không trong phạm vi task này.
