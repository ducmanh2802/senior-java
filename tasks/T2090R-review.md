# T2090R — Fact-check nội dung mới của T2090

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2090 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi kỹ thuật trong 6 câu hỏi mới (jpa-064..jpa-069):

1. **jpa-064 (N+1 query)**: Sửa code test datasource-proxy — `@DataSourceProxyConfiguration` không tồn tại, `ProxyDataSource.getQueryCount()/getQueryByType()` không có API này. Thay bằng `@AutoConfigureDataSourceProxy` + dùng `proxy.getQueryExecutions().stream().filter(...)` hoặc `ProxyTestDataSource` từ thư viện `datasource-assert`. Cũng sửa markup: backticks trong template literal → `{{...}}`.

2. **jpa-067 (Bulk update @Modifying)**: `@CacheInvalidate` là Spring Cache annotation, không phải Hibernate L2 cache. Sửa thành evict region thủ công qua `sessionFactory.getCache().evictEntityRegion("Order")`. Cũng sửa markup: backticks → `{{...}}`.

3. **jpa-069 (Batch insert 100k)**: `hibernate.id.new_generator_mappings: true` đã bị xoá trong Hibernate 6 (new generators là mặc định). Xoá property này khỏi application.yml.

Các câu hỏi jpa-065, jpa-066, jpa-068 không có lỗi kỹ thuật.
