# T1259R — Fact-check nội dung mới của T1259

Status: DONE
Agent: opencode
Owns: `js/data/q-system-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1259 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- design-007 (news feed): celebrity 50M follower vs ngưỡng 10k → vượt 5 lần → 500 lần. Sửa thành 5.000 lần.
- design-010 (distributed lock): "A tỉnh awake và ghi phủ kết quả của A" → "ghi phủ kết quả của B" (A ghi overwrite B).
- lessons-security.js: lesson-security-010.body: `{{alg="none"}}` → `{{alg=none}}` (validator báo inline code chứa `{` lồng nhau).