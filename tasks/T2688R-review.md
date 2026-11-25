# T2688R — Fact-check nội dung mới của T2688

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2688 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kiến thức trong 4 bài SD mới (sd-053, sd-054, sd-055, sd-056). Các bài đã đúng kỹ thuật:
- sd-053: BNPL back-office (funding headroom atomic check, settlement idempotent, DPD collections, ECL IFRS9)
- sd-054: pKYC + AML screening (blocking+fuzzy, real-time/batch, name_norm tiếng Việt, 4-eyes, STR/SAR)
- sd-055: BNPL consumer (credit limit conditional UPDATE, installment snapshot, scoring fail-closed, reconciliation)
- sd-056: eKYC onboarding (presigned URL, OCR/face/liveness/NFC, PII security, manual review SLA)

Validation errors báo ra thuộc file khác (q-sql.js, q-devops.js, quiz-spring.js, lessons-*.js, projects.js, path.js, index-light.js) — ngoài quyền sở hữu task này theo AGENTS.md §3.
