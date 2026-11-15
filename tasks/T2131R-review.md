# T2131R — Fact-check nội dung mới của T2131

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2131 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check T2131 trên `js/data/q-spring-data.js` (11 điểm chèn thêm: 6 sơ đồ `~~~seq`, 3 bảng tóm tắt, 2 sơ đồ ASCII `~~~text`). Đã kiểm tra kỹ thuật từng điểm:

- **@ControllerAdvice** (q-spring-data.js:852): seq 4 actor (Client/Controller/Advice/Client), flow ném exception → ProblemDetail 404 → application/problem+json, đúng chuẩn RFC 7807.
- **Routing datasource primary/replica** (q-spring-data.js:3695): seq RouteDataSource kiểm tra `isCurrentTransactionReadOnly()` chọn Primary/Replica, đúng với cơ chế `AbstractRoutingDataSource`.
- **Bean selection table** (q-spring-data.js:5111): @Primary / @Qualifier / List-Map / tên tham số — thứ tự ưu tiên đúng, @Primary vẫn nằm trong List.
- **B-tree bị bỏ qua** (q-spring-data.js:5723): DATE(cột) và LIKE '%abc' không dùng index, LIKE 'abc%' dùng — đúng.
- **REQUIRES_NEW cạn pool** (q-spring-data.js:6361): seq Thread→Pool→Tx ngoài→Tx trong, 2 connection cùng lúc, đúng công thức T×(n−1)+1.
- **Auto-config flowchart** (q-spring-data.js:6387): ConditionalOnClass → OnMissingBean → OnProperty, thứ tự đúng.
- **Persistence context dirty checking** (q-spring-data.js:6768): EntityEntry + snapshot → UPDATE khi flush, đúng.
- **LazyInitializationException** (q-spring-data.js:6821): seq Service→Persistence context→Jackson→DB, session đã đóng khi Jackson đọc lazy proxy — đúng.
- **Optimistic lock @Version** (q-spring-data.js:6865): Client A/B cùng version 7, A commit → version 8, B UPDATE 0 row → OptimisticLockException — đúng.
- **HHH000104 fetch join + LIMIT** (q-spring-data.js:6956): 20 đơn × 15 item = 300 row, LIMIT 20 cắt theo dòng SQL → chỉ ~1 đơn, load hết vào memory — đúng.
- **ID strategy table** (q-spring-data.js:6898): SEQUENCE+allocationSize gom batch được, IDENTITY không — đúng.

Không phát hiện lỗi kiến thức, lỗi markup, hay chữ nước ngoài lẫn vào. Không cần sửa file nào.

`node scripts/validate.js` → `OK — không có lỗi.`
