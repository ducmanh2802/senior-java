# T1537R — Fact-check nội dung mới của T1537

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1537 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (theo từng id):
- sd-026 (phases Requirements): từ lẫn tiếng Pháp "disponibilité 99.95%" → "khả dụng 99.95%".
- sd-026 (bảng Failure Modes): từ lẫn tiếng Trung "Gửi sai ý愿" → "Gửi sai ý định của người dùng (gửi theo preference cũ)".
- sd-025 (section 4 Execution Engine): idempotency_key = runId:stepIdx:toolName:attempt là cơ chế nói ngược (key thay đổi mỗi lần retry → không deduplicate được lệnh gọi lại) → đổi thành idempotency_key = runId:stepIdx:toolName, attempt chỉ ghi vào payload log.

Không chỉnh văn phong, độ dài, bố cục; không thêm/xoá mục; không sửa nội dung đã có ở HEAD. Chỉ sửa file js/data/sd-problems.js (index-light.js sinh lại bằng build-light-index.js).
node scripts/build-light-index.js → OK; node scripts/validate.js → OK — không có lỗi.
