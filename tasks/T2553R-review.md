# T2553R — Fact-check nội dung mới của T2553

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2553 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review T2553 (mới trong js/data/q-spring-data.js): jpa-083 (mapper XML/annotation + dynamic SQL if/where/foreach/choose), jpa-084 (resultMap association/collection, nested select N+1 vs nested result join), jpa-085 (#{} vs ${}, SQL injection, ExecutorType.BATCH, Spring DataSourceTransactionManager/SqlSessionTemplate), jpa-086 (khi chọn MyBatis so với JPA, trade-off, hybrid).

Không tìm thấy lỗi kiến thức: API/flag đúng (PreparedStatement #{}, ${} chỉ dùng cho identifier và phải whitelist, ExecutorType.BATCH cần flushStatements()/commit, key chỉ có sau flush, SqlSessionTemplate thread-safe và join transaction hiện tại, openSession() trong @Transactional không tham gia transaction, resultMap cần id để gom collection, nested select 1+N truy vấn còn join 1 truy vấn nhưng result set lặp, JPA lazy/dirty-checking còn MyBatis thủ công), không số liệu vô căn cứ (con số trong "Ví dụ đời thực" là ý minh họa), markup hợp lệ (không backtick trong đáp án, \${} đã escape, fence ~~~ cân bằng, không HTML thô), id jpa-083→086 tăng duy nhất sau jpa-082, topic jpa thuộc file này (topics.js:14), độ dài đáp án > 1500 ký tự (không cảnh báo ngắn). → Không sửa gì (theo T2553R chỉ sửa lỗi kiến thức, không chỉnh văn phong/dài dài/bố cục).

node scripts/validate.js q-spring-data.js: không lỗi nào gắn với file này (cảnh báo db-069 ngắn là câu cũ, không thuộc T2553).

node scripts/validate.js toàn bộ: không tới được OK do lỗi trước đó trong file KHÔNG thuộc T2553 (không được sửa theo luật 3 AGENTS.md):
- js/data/bugs.js: lỗi cú pháp 'Unexpected token new' (backtick thô trong template literal, dòng ~9204) — bản HEAD parse OK, thay đổi +1014 dòng là của agent khác.
- js/data/q-spring-data.js.bak: file chưa theo dõi, không khai báo trong data-manifest.
- index-light.js: báo cũ chỉ vì loader validate bỏ qua bugs.js hỏng (build tính bugs: [] còn file có 46 entry bugs); nội dung câu hỏi đã cập nhật (có jpa-083), không tái sinh vì sẽ xóa dữ liệu bugs đúng.
