# T1256R — Fact-check nội dung mới của T1256

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1256 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

spring-015 (Actuator, "Ví dụ đời thực"): sửa lỗi tính toán "Prometheus scrape 50 pod x 30s = 100 scrape/s" → "100 scrape/phút" (50 pod × 2 lần/phút = 100, không phải 100/giây). Bỏ "– tổng 200.000 series" vì số liệu không khớp (50 × 2.000 = 100.000 unique series, không phải 200.000). Các phần nội dung mới khác (spring-014, jpa-001, jpa-005, jpa-007, db-001) đã fact-check: đúng kỹ thuật Spring Boot 3.x / Hibernate 6 / PostgreSQL 15, markup `{{ }}` hợp lệ, không backtick/`${`, không từ nước ngoài non-kỹ thuật. Không sửa nội dung HEAD.
