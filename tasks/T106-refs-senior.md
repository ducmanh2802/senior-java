# T106 — Nguồn học thêm cho câu senior quan trọng

Status: DONE
Agent: opencode
Owns: `js/data/q-java.js`, `js/data/q-concurrency-jvm.js`, `js/data/q-spring-data.js`, `js/data/q-microservices.js`, `js/data/q-system-design.js`, `js/data/q-scenario.js`

Đọc AGENTS.md mục 13. Với các câu `level: 'senior'` **chưa có `refs`** trong các file trên (ưu tiên topic core, collections, concurrency, jvm, spring, jpa, db, microservices, design, scenario), thêm `refs` 2–3 nguồn. **Chỉ link chắc chắn tồn tại**, ưu tiên tài liệu chính thức. Sau mỗi file: `node scripts/validate.js <file>` và `node scripts/check-links.mjs <file>` → hỏng 0 (môi trường của bạn có thể chặn mạng: khi đó chỉ dùng URL tài liệu chính thức có cấu trúc ổn định như docs.oracle.com/javase/specs, openjdk.org/jeps/<số>, docs.spring.io/spring-framework/reference, postgresql.org/docs/current; KHÔNG dùng link YouTube). Không sửa nội dung khác.

## Notes
- Đã bổ sung refs cho các câu senior còn thiếu; hiện cả 180 câu senior trong sáu file đều có nguồn. Không thay nội dung câu hỏi/đáp án.
- `node scripts/validate.js` và `node --check` cho sáu file đều đạt. `node scripts/check-links.mjs` đã chạy nhưng môi trường chặn mọi yêu cầu mạng (`EACCES`); dùng URL tài liệu chính thức/ổn định theo hướng dẫn.
Reviewed-by: codex (T106R)
