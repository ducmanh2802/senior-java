# T1297R — Fact-check nội dung mới của T1297

Status: TODO
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1297 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ nội dung mới thêm vào `js/data/q-security.js` (40 câu hỏi security-001…security-040, phần `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` của security-019, 020, 021, 022).

### Các lỗi đã sửa (theo id)

- **security-019** (AWS Secrets Manager rotation): Sửa câu sai về HikariCP — gốc text viết "Connection pool maxLifetime=30 phút (mặc định) lớn hơn chu kỳ rotation (30 ngày)" (lô-gic ngược: 30 phút < 30 ngày). Đã sửa thành: maxLifetime=30 phút vẫn tạo connection mới bằng mật khẩu đã cache; root cause là app đọc secret một lần và cache vô hạn, mọi connection mới đều dùng mật khẩu cũ sau khi rotation.
- **security-020** (Method security / multi-tenant): Sửa cụm sai về Hibernate filter — "@FilterDef" không có tham số; parameter được set qua `session.enableFilter("tenantFilter").setParameter(...)`. Đã sửa thành "chưa được enable và set parameter (bằng session.enableFilter().setParameter()) — dev quên bước này".

### Lỗi không phải của mình (đề xuất cho integrator)

- `q-system-design.js:design-019.a`: inline code `{{/payments/{id…}}` và `{{/orders/{id…}}` chứa dấu `{ }` lồng nhau — validator báo sẽ hiển thị sai. File này không phải `js/data/q-security.js`, không được phép sửa; đề xuất agent sở hữu file đó sửa bằng cách đưa vào code block `~~~text` hoặc viết lại.

### Kết quả

- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn 2 cảnh báo unrelated: lesson-design-006/007 không trong PATH)
- `node --check js/data/q-security.js` → SYNTAX OK
- Không thêm/xoá mục, không sửa nội dung đã có ở HEAD.

Status: DONE
