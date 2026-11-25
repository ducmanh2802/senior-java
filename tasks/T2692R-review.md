# T2692R — Fact-check nội dung mới của T2692

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2692 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Sửa trực tiếp 2 lỗi kỹ thuật trong nội dung mới của T2692 (bài học 027–030, file lessons-microservices.js; không sửa file khác):
- lesson-microservices-029: test "half-open allows limited probes" mâu thuẫn với nội dung body ("đủ permits → chuyển CLOSED") và với test "probe success closes breaker": sau đủ permits thành công breaker phải về CLOSED, không còn HALF_OPEN và không từ chối lần gọi tiếp. Sửa aspettativa test (equ CLOSED, lần gọi sau được phép) cho khớp body + reference. test-lessons.js: 5/5 pass.
- lesson-microservices-030: body ghi cờ Jackson bịa `{{ORDER_MAP_ENTRIES_BY_KEYS}}` (không tồn tại trong Jackson). Sửa thành: "Production thường dùng Jackson để chuẩn hóa JSON (sắp xếp khóa), rồi tính SHA-256 làm fingerprint."

Khác: lessons-microservices.js không còn lỗi validate.js nào. test-lessons.js pass hết 4 bài (027: 6/6, 028: 7/7, 029: 5/5, 030: 5/5). validate.js còn báo lỗi ở file KHÔNG sở hữu của task này (q-sql.js lỗi cú pháp tại dòng 9745 làm build-light-index.js crash → index-light.js cũ; path.js thiếu câu hỏi devops; lessons-sql/lessons-jpa related/body) — do các agent khác sở hữu, không động theo luật 3.
