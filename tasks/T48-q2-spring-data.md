# T48 — Nội dung: Spring, JPA, Database (đợt 2)

Status: TODO
Agent: opencode
Owns: `js/data/q-spring-data.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `spring`: thêm 6 câu (đang có 15 → mục tiêu ≥ 21)
- {{@TransactionalEventListener}} và Spring events: phase AFTER_COMMIT, pitfall mất event khi crash, so với outbox
- {{@Cacheable}}: proxy, key, TTL với Redis, cache null, self-invocation, cache stampede
- HTTP client trong Spring Boot 3: RestClient, WebClient, HTTP interface ({{@HttpExchange}}); cấu hình timeout/pool đúng
- Bean Validation: {{@Valid}} vs {{@Validated}}, group, custom constraint, validate ở tầng nào
- Spring Batch: chunk-oriented, restartability, skip/retry, partitioning cho job tỷ dòng
- Spring Security: method security {{@PreAuthorize}}, OAuth2 resource server, CORS và CSRF cho SPA

### topic `jpa`: thêm 8 câu (đang có 9 → mục tiêu ≥ 17)
- Fetch plan: {{JOIN FETCH}} vs {{@EntityGraph}} vs {{@BatchSize}}; {{MultipleBagFetchException}} và cách giải
- Phân trang kèm JOIN FETCH collection: cảnh báo HHH90003004 (phân trang trong bộ nhớ) và cách sửa bằng 2 query
- Bulk update/delete JPQL: bỏ qua persistence context, dữ liệu cũ trong cache, {{@Modifying(clearAutomatically)}}
- Batch insert 1 triệu dòng với Hibernate: {{jdbc.batch_size}}, {{order_inserts}}, flush/clear, {{StatelessSession}}
- DTO/interface projection, {{@Query}} constructor expression: khi nào thay entity để giảm tải
- Inheritance mapping: SINGLE_TABLE vs JOINED vs TABLE_PER_CLASS, trade-off hiệu năng
- {{@Transactional(readOnly = true)}} thực sự làm gì với Hibernate và connection; routing sang read replica
- Auditing: Spring Data {{@CreatedDate}}/{{@LastModifiedBy}} vs Hibernate Envers; soft delete với {{@SQLDelete}}/{{@SQLRestriction}}

### topic `db`: thêm 8 câu (đang có 11 → mục tiêu ≥ 19)
- MVCC trong PostgreSQL: tuple version, VACUUM, bloat, transaction ID wraparound; long transaction gây hại thế nào
- Các loại index PostgreSQL: partial, expression, GIN (JSONB, full-text), BRIN cho bảng log theo thời gian
- Table partitioning theo range thời gian: partition pruning, quản lý partition, drop dữ liệu cũ
- Join algorithms: nested loop, hash join, merge join — đọc plan và vì sao optimizer chọn sai (statistics)
- Read replica: replication lag, read-your-writes, routing đọc/ghi trong Spring
- Window functions cho báo cáo: running balance, ranking, top-N per group
- Stored procedure trong hệ thống ngân hàng: ưu/nhược, khi nào nên chuyển logic lên tầng Java
- Backup & recovery: PITR, WAL archiving, RPO/RTO cho database giao dịch

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
