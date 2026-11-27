# T2832R — Fact-check nội dung mới của T2832

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2832 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- sd-067: sửa số liệu tick storage sai hệ số 10: "~345 GB/ngày" → "~3,45 TB/ngày" (200.000 tick/s × 86.400 s × 200 B ≈ 3,46 TB) ở Estimation guide và bảng Ước lượng. Các lỗi validate còn lại (quiz-ops, lessons-*) là pre-existing, không thuộc file này. build-light-index.js không chạy được do SyntaxError pre-existing trong lessons-devops.js.
