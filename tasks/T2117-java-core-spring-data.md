# T2117 — Gắn tag 'core' cho ~80 câu lõi trong q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2090

Người học chỉ có 6 tháng, không thể học hết ~2000 câu. Cần **bộ câu lõi khoảng 400 câu** toàn ngân hàng. Việc của task này: trong `js/data/q-spring-data.js` (topic: spring, jpa, db), chọn **khoảng 80 câu** mà phỏng vấn Senior Java ở Việt Nam (ngân hàng, fintech, outsource lớn) **hay hỏi nhất**, rồi thêm chuỗi `'core'` vào mảng `tags` của câu đó (chưa có `tags` thì thêm `tags: ['core']`).

Tiêu chí chọn: IoC/DI, bean lifecycle/scope, AOP proxy và @Transactional (self-invocation, propagation, rollback rules), Spring Boot auto-config, N+1, lazy loading, persistence context, optimistic/pessimistic lock, isolation level, index, connection pool. Ưu tiên level mid/senior, câu có đáp án đầy đủ (có Tóm tắt + Trả lời mẫu); **không chọn 2 câu trùng ý** (nếu trùng chọn câu đáp án tốt hơn). Câu lead chỉ chọn khi thật kinh điển.

Cách làm: `node scripts/qtool.js list js/data/q-spring-data.js` để xem danh sách id + câu hỏi, chọn trên danh sách đó (KHÔNG đọc cả file). Chỉ sửa đúng dòng `tags` (hoặc thêm dòng tags) của câu được chọn; **KHÔNG sửa nội dung q/a/follow, không xoá câu nào**. Đếm số câu trước/sau phải bằng nhau. Notes: liệt kê id đã gắn 'core'.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- Task này **chỉ sửa mảng tags** của các câu được chọn (ngoại lệ cho luật "chỉ thêm"); không sửa q/a/follow, không xoá câu, không sửa file khác. Đếm số câu trước/sau phải bằng nhau.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Gắn tag `core` cho **79 câu** trong `js/data/q-spring-data.js` (chỉ thêm/sửa dòng `tags`, không sửa q/a/follow, không xoá câu). Số câu trước/sau: 209.
- IDs (79): spring-001, spring-002, spring-003, spring-004, spring-005, spring-006, spring-007, spring-013, spring-014, spring-019, spring-022, spring-023, spring-024, spring-025, spring-026, spring-027, spring-028, spring-029, spring-030, spring-039, spring-040, spring-041, spring-050, spring-051, spring-071, spring-085, spring-094, jpa-001, jpa-002, jpa-003, jpa-004, jpa-005, jpa-006, jpa-007, jpa-008, jpa-009, jpa-010, jpa-013, jpa-016, jpa-018, jpa-019, jpa-020, jpa-021, jpa-022, jpa-023, jpa-024, jpa-025, jpa-026, jpa-030, jpa-031, jpa-032, jpa-034, jpa-038, jpa-039, jpa-064, jpa-065, jpa-066, db-001, db-002, db-003, db-004, db-005, db-006, db-007, db-008, db-009, db-010, db-012, db-013, db-015, db-016, db-020, db-021, db-022, db-023, db-040, db-043, db-048, db-049.
- Tiêu chí chọn: IoC/DI, bean lifecycle/scope/stereotypes, AOP proxy & @Transactional (self-invocation/propagation/rollback/isolation), Spring Boot auto-config & config/profiles/validation, N+1, persistence context/dirty checking, lazy loading/OSIV, optimistic/pessimistic lock, batching/id strategy, JPA caching, mapping/DTO basics, index/EXPLAIN, ACID/isolation, deadlock/locking, pagination, connection pool (HikariCP), replication/sharding/partitioning basics, MVCC/WAL. Ưu tiên mid/senior, đáp án RST đầy đủ; tránh trùng ý (chọn câu đáp án tốt hơn).
- Kiểm tra: `node --check js/data/q-spring-data.js` → OK (SYNTAX_OK).
- Không thể hoàn tất `node scripts/build-light-index.js` và `node scripts/validate.js` tới OK do lỗi **sẵn có ngoài phạm vi sở hữu**: `build-light-index.js` dừng với `SyntaxError: Unexpected end of input` tại `q-java.js:12084` (file không thuộc task), nên `index-light.js` chưa được rebuild và `validate.js` vẫn báo `index-light.js: đã cũ...` cùng nhiều lỗi liên quan khác (lessons/path/projects refs không tồn tại, v.v.) có từ trước. Không sửa file ngoài quyền. Cần integrator sửa `q-java.js` rồi chạy lại `node scripts/build-light-index.js && node scripts/validate.js`.
Reviewed-by: kilo (T2117R)
