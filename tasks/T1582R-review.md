# T1582R — Fact-check nội dung mới của T1582

Status: DONE
Agent: opencode
Owns: `js/data/sd-problems.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1582 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- sd-037: Sửa ước lượng trong `phases.Estimation` đang mâu thuẫn (ghi 200M token/ngày nhưng phép tính suy ra 100B) → chuẩn hoá thành `1M DAU x 10 hội thoại x 20 lượt x 500 token/lượt = 100B token/ngày (input+output)`; giữ 5M token/s peak và ~200 GB lịch sử.
- sd-038: Sửa ký tự nước ngoài lẫn vào Deep dive (`CAS driver state防止 double-assign` → `CAS driver state để ngăn double-assign (giao 1 tài xế cho 2 khách)`); sửa bảng ước lượng "Xem xe quanh peak" mâu thuẫn với requirements/đoạn dưới (từ `500k rider x 0,1 req/s = ~50.000 QPS` → `~5.000 QPS tới backend` có cache theo ô H3 + TTL ngắn) để nhất quán.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path lessons sẵn có). Không chạy `node scripts/test-lessons.js` vì không sửa file bài học.
