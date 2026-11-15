# T2110 — 2 debug lab (incident) vào labs-incident.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-incident.js`
After: T2078

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-incident.js` để không trùng tình huống. id `lab-incident-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Sự cố dây chuyền (cascading failure) khi service thanh toán chậm**: trace cho thấy order-service giữ thread chờ payment 30s, thread pool Tomcat cạn, gateway trả 503 toàn hệ thống; cách sửa: timeout ngắn, circuit breaker, bulkhead, fallback

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-incident.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 lab level senior vào js/data/labs-incident.js (id nối tiếp sau lab-incident-036):
- lab-incident-037: cascading failure khi thanh toán chậm — order-service giữ thread Tomcat 30s chờ payment, pool cạn, gateway 503/504 toàn hệ thống (kể cả xem số dư ví dùng chung pool); sửa: timeout ngắn giảm dần từ ngoài vào trong, circuit breaker, bulkhead, fallback, idempotency key theo orderId.
- lab-incident-038: mất cập nhật tồn kho (lost update) — 2 transaction đọc stock=1 cùng lúc, tồn kho xuống -1, 2 đơn đều 200 OK; sửa: @Version (optimistic lock) + retry khi StaleObjectStateException, hoặc SELECT FOR UPDATE (pessimistic lock) khi xung đột nhiều.

Kiểm tra: node --check js/data/labs-incident.js → OK; node scripts/validate.js js/data/labs-incident.js → OK (không lỗi mới; debug lab 36 → 38 bài, incident 38).
Lưu ý: node scripts/build-light-index.js và validate.js toàn repo không thể đạt OK do lỗi cú pháp đã có sẵn trong q-security.js, q-devops.js (file không thuộc task này, không được sửa theo quy tắc 3 AGENTS.md). index-light.js không bị ảnh hưởng bởi labs (light index chỉ gồm questions/algos/lessons/sd/drills/companies/quiz).
Reviewed-by: kilo (T2110R)
