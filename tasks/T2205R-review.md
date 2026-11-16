# T2205R — Fact-check nội dung mới của T2205

Status: DONE
Agent: opencode
Owns: `js/data/quiz-ops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2205 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| qz-devops-061 | Option 0 và explain nói "Pod không bao giờ Ready" — sai kỹ thuật: với initialDelaySeconds=10, failureThreshold=3, app khởi động 90s thì Pod chỉ bị gỡ khỏi endpoints trong lúc khởi động (khoảng t=20s→t=90s), trở lại Ready khi app đã listen; readiness fail không restart pod | Sửa option 0 thành "Pod không Ready trong lúc khởi động, trở lại Ready khi app đã listen; nếu có liveness probe tương tự thì bị kill/restart"; cập nhật explain tóm tắt tương ứng. answer giữ 0. validate.js OK. |