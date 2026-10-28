# T338R — Fact-check nội dung mới của T338

Status: DONE
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T338 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Lỗi kỹ thuật đã sửa (của model free viết lại trong T338):

- devops-012: Bỏ trùng lặp section "### Lỗi hay gặp" xuất hiện hai lần.
- devops-013: Sửa định nghĩa idempotency: "Non-idempotent" = mỗi lần thực thi thay đổi trạng thái (POST chuyển tiền, tạo resource mới); "Idempotent" = thực thi nhiều lần như một lần (GET/PUT/DELETE); "Idempotency key" = header client tạo để server nhận dạng request trùng, trả kết quả cũ.
- devops-015: Sửa số liệu throttling: "8 thread xong quota 2 trong 25ms -> throttle ~88ms" → "~75ms" (tính toán đúng: 200ms CPU cần / 2 quota = 100ms chu kỳ, ~75ms bị treo).
- devops-016: Sửa định nghĩa CFS: CFS là kernel Linux scheduler, không phải cơ chế Kubernetes; Kubernetes áp CFS qua cgroup/CPU quota. Xoá property bịa `spring.security.filter.dispatchType`, thay bằng cấu hình permitAll cho endpoint health.
- devops-014: Không có lỗi nào; summary và kiến trúc phân vùng 3 vùng (DEV/DMZ/PROD) nhất quán.

node scripts/validate.js → OK — không có lỗi.
