# T1573R — Fact-check nội dung mới của T1573

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1573 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi kỹ thuật trong `js/data/q-security.js`:

1. **security-002 (SQL Injection)**: Sửa mô tả MySQL Connector/J — bản 8.0+ mặc định dùng server-side prepared statements (`useServerPrepStmts=true`), không còn client-side emulation như bản cũ. Đã cập nhật ghi chú cho đúng thực tế.

2. **security-005 (Password Hashing - bcrypt/Argon2id)**: Xoá tham chiếu CVE-2025-22228 (mã CVE tương lai/giả định) thay bằng "từ bản 6.3.8 / 6.4.4 trở lên". Sửa tham số Argon2id: RFC 9106 chỉ định nghĩa thuật toán, không quy định tham số cụ thể (m=65536, t=3, p=4 là khuyến nghị OWASP mạnh hơn, không phải RFC).

3. **security-005**: Cập nhật ghi chú tham số Argon2id để phân biệt rõ: "cấu hình mạnh hơn thường dùng" thay vì gán cho RFC 9106.

Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
