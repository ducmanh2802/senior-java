# T2315R — Fact-check nội dung mới của T2315

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2315 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi đã sửa (nội dung mới của T2315, file q-spring-data.js):
- jpa-070, jpa-071, jpa-072, jpa-073, jpa-074 (câu mới): kiểm tra kỹ thuật (@Version/optimistic lock, retry ngoài transaction, batch insert IDENTITY/SEQUENCE, projection closed/open, readOnly Hibernate+PostgreSQL, keyset pagination) — không sai kỹ thuật, giữ nguyên.
- spring-087 (logging): xoá bullet "Từ Spring Boot 4.2, có thể đổi tên khoá MDC bằng ..." — phiên bản bịa (dự án dùng Spring Boot 3.x), thuộc tính MDC đổi tên không chắc chắn.
- spring-082/K8s shutdown: sửa bullet "Từ Spring Boot 3.4, server.shutdown=graceful là mặc định" — sai, giá trị mặc định là {{immediate}}; graceful chỉ khi bật tường minh.

Không chỉnh văn phong, bố cục; không sửa nội dung đã có ở HEAD; không thêm/xoá mục.
Da chay: node scripts/build-light-index.js (sinh lai index-light.js), node scripts/validate.js q-spring-data.js -> OK — khong co loi.
Validate toan bo con loi o sdlc.js, quiz-design.js, quiz-ops.js, q-system-design.js.new, path.js — nh file ngoai nhiem vu, khong duoc sua theo luat 3.