# T2619R — Fact-check nội dung mới của T2619

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2619 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- jpa-087: sửa cơ chế sai — không thể đặt `hibernate.cache.use_second_level_cache=false` "ở session riêng" vì đây là thuộc tính bootstrap/SessionFactory-level. Đổi thành tắt 2LC cho transaction bulk load bằng `CacheMode.IGNORE` trên session của transaction đó.
- jpa-088: không có lỗi kiến thức (constructor expression @Query giảm cột đúng, interface projection đã phân tách rõ).
- jpa-089: không có lỗi kiến thức (luồng L1→L2→DB đúng, khuyên không cache số dư tài khoản đúng, cảnh báo 2LC local per-instance đúng).
