# T633R — Fact-check nội dung mới của T633

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T633 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã rà soát phần mới `git diff HEAD -- js/data/lessons-jpa.js` (thêm `lesson-jpa-006`, `lesson-jpa-007`). Không sửa nội dung đã có ở HEAD.

Kiểm tra đã chạy (file sở hữu):
- `node --check js/data/lessons-jpa.js` → OK.
- `node scripts/test-lessons.js lesson-jpa-006` → `Lesson exercises OK: 1/1` (10/10 case: reference pass, starter compile/không pass theo harness).
- `node scripts/test-lessons.js lesson-jpa-007` → `Lesson exercises OK: 1/1` (15/15 case).
- `node scripts/validate.js` đọc được dữ liệu lessons-jpa (JPA topic 29 câu, tổng 115 bài học/130 bài tập) nhưng **không thể OK toàn cục** do lỗi có sẵn ngoài phạm vi sở hữu: `q-english.js` lỗi cú pháp `Unexpected token ','` (validator + build-light-index), và `projects.js` tham chiếu `english-021/022` không tồn tại; `index-light.js` báo cũ nhưng `node scripts/build-light-index.js` bị chặn bởi lỗi `q-english.js`. Không sửa các file này (ngoài `lessons-jpa.js`).

Sửa theo từng id:

- `lesson-jpa-006` (Owning side, cascade, orphanRemoval):
  - Sửa `~~~seq` có 3 dòng > 60 ký tự (61, 62, 61) — vi phạm luật sequence diagram/validator tiềm ẩn; rút gọn nội dung bước nhưng giữ đúng luồng (persist + addLine 2 lần, cascade PERSIST, INSERT cha/con, UPDATE FK theo owning side).
  - Kiểm tra kỹ thuật: owning/inverse + `mappedBy`, FK đọc từ owning side lúc flush, helper hai chiều, cascade PERSIST/REMOVE/ALL, `orphanRemoval` (gỡ khỏi collection, chi phí tải collection/snapshot, bulk DML bỏ qua persistence context + phải xóa con trước cha nếu FK), `@ManyToOne(cascade=REMOVE)` nguy hiểm, `@ManyToMany` không có `orphanRemoval`, clear() không xóa row nếu thiếu orphanRemoval, equals/hashCode với Set — đều đúng với Hibernate 6 / JPA. Test harness xác định, chỉ JDK chuẩn.

- `lesson-jpa-007` (Second-level cache và query cache):
  - Loại provider lỗi thời/không dùng với Hibernate 6 hiện hành: bỏ `{{jboss-cache}}` khỏi danh sách provider; thay bằng mô tả đúng: `Ehcache 3 qua hibernate-jcache, Infinispan hoặc Hazelcast`.
  - Làm rõ cơ chế invalidation khi bulk DML cho Hibernate 6 (tránh phát biểu tuyệt đối "region không hề biết"): bulk/native/script không đi qua entity nên Hibernate không cập nhật từng entity cache; region/query space liên quan thường bị evict (Hibernate 6 có query spaces). Ứng dụng vẫn có thể đọc stale tới khi region làm mới/hết hạn; khuyến nghị `clearAutomatically`/evict rõ ràng sau bulk DML.
  - Làm rõ multi-node: Infinispan/Hazelcast hỗ trợ region phân tán/cụm hoặc invalidation qua mạng; cache local JVM vẫn stale tới invalidation/TTL.
  - Kiểm tra kỹ thuật: L1/L2/query cache phân tầng đúng; L2 lưu dehydrated state (không identity xuyên session); `@Cacheable` + `@Cache(usage=...)`, Ehcache/JCache provider hợp Hibernate 6; chiến lược read-only/read-write/nonstrict-read-write/transactional (JTA, Infinispan) đúng; bulk `@Modifying`/native bỏ qua context, region evict theo bảng/query space; `retrieveMode=BYPASS`, `factory.getCache().evictAll()`; proxy LAZY + cache rủi ro; query cache lưu id + update timestamp vô hiệu hóa — đúng. `hasJpa=true` trong wrapper; test harness xác định.

