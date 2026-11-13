# T2027R — Fact-check nội dung mới của T2027

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2027 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lesson-microservices-014.body`: sơ đồ `~~~seq` lỗi (`note:` thiếu actor range) → `note Kafka..Consumer: offset chưa commit`. Sửa định dạng template literal (leading space làm fence/heading/lịch render sai).

- `lesson-microservices-015.body`: sơ đồ `~~~seq` lỗi (`note:` thiếu actor range, dòng `... lặp 3 lần ...` không hợp lệ) → `note Caller..CircuitBreaker: …` + bỏ dòng invalid. Sửa typo `Testinject` → `Test inject`.

- Kiến thức mới đúng (at-least-once, dedup inbox, circuit breaker states) — chưa có lỗi nội dung. `node scripts/test-lessons.js` cho bài mới pass.

- Các lỗi còn lại của `node scripts/validate.js` nằm ở `js/data/lessons-security.js` (`lesson-security-013` …) — file KHÔNG nằm trong `Owns` của task này; theo AGENTS.md §3 (luật 3) tôi không sửa file ngoài phạm vi và ghi đề xuất vào phần này thay thế.
