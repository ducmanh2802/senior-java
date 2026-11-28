# T2882R — Fact-check nội dung mới của T2882

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2882 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review toàn bộ `js/data/lessons-microservices.js` (34 bài microservices-001..034, 36 bài tập) do T2882 viết: không phát hiện lỗi kiến thức (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), không lỗi markup (`~~~seq`, `{{}}`, backtick, `###` thụt dòng, ký tự lạ) — `node scripts/validate.js` không báo lỗi nào thuộc file này. Tất cả 36 bài tập: reference pass hết, starter không pass (chạy runner riêng vì `test-lessons.js` crash do `lessons-db.js` của task khác lỗi cú pháp). Không chèn/sửa nội dung (quy tắc chỉ giữ kiến thức đúng). Một điểm đã tra external: Kafka 3.x default `partition.assignment.strategy` = `[RangeAssignor, CooperativeStickyAssignor]` dùng RangeAssignor trước → lesson-023 viết đúng, không sửa.
Chú ý: `validate.js` không thể in `OK` toàn diện trong working tree này do `lessons-db.js` (file của task khác, không được tôi sửa) lỗi cú pháp; điều đó cũng chặn `build-light-index.js` → `index-light.js` vẫn stale (cần integrator sửa `lessons-db.js` rồi sinh lại index).
