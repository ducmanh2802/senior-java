# T1393R — Fact-check nội dung mới của T1393

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1393 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa các lỗi kỹ thuật sau trong nội dung mới của T1393:

**spring-042** (id spring-042): Sửa sai sót về fallback executor của Spring Boot 3. Khi không khai báo bean TaskExecutor, Spring Boot 3 tự cấu hình ThreadPoolTaskExecutor (core 8, queue unbounded), KHÔNG phải SimpleAsyncTaskExecutor. SimpleAsyncTaskExecutor chỉ dùng khi hoàn toàn không có auto-configuration.

**spring-043** (id spring-043): 
- Sửa lệnh tạo CDS archive: thay `-Dspring.context.exit=onRefresh` (property không tồn tại) bằng cách chạy đúng classpath sau khi extract jar.
- Thêm "(dự kiến)" cho JDK 24 / JEP 483 / Project Leyden vì JDK 24 chưa phát hành (chuẩn dùng Java 17/21).

**spring-044** (id spring-044): Thêm "(dự kiến)" cho JEP 491 (Java 24) về virtual thread pinning.

**jpa-043** (id jpa-046): Sửa default của `hibernate.query.in_clause_parameter_padding` — từ Hibernate 6.2 mặc định là **bật (true)**, không phải tắt.

**jpa-047** (id jpa-047): Sửa nhận định về IDENTITY batching — PostgreSQL 10+ hỗ trợ `INSERT ... RETURNING` cho phép batch một phần, không hoàn toàn "không gom batch được". Cập nhật bảng so sánh và phần giải thích chi tiết.

**db-043** (id db-043): Sửa công thức sizing pool — quy tắc `(cores × 2) + spindles` là kinh nghiệm cộng đồng, không phải công thức chính thức của HikariCP.

**db-050** (id db-050): Sửa `transaction_timeout` — PostgreSQL 17 chưa phát hành (chuẩn dùng PostgreSQL 15), ghi rõ "(PG 17+, chưa phát hành)".

Tất cả validation pass: `node scripts/validate.js` → OK. Đã chạy `node scripts/build-light-index.js` để cập nhật index-light.js.
