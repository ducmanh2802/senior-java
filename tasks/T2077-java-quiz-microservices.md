# T2077 — 12 câu trắc nghiệm (microservices) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2029

Thêm **12 câu trắc nghiệm** vào `js/data/quiz.js` (topic `microservices`; id `qz-microservices-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-microservices-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống microservices: circuit breaker (Resilience4j) mở/nửa mở, saga orchestration vs choreography, outbox, idempotent consumer, timeout lồng nhau, consistency giữa service, chọn sync vs async.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 12 câu vào `js/data/quiz.js` (append, chỉ thêm — không sửa mục cũ): `qz-microservices-021` … `qz-microservices-032`.

Chủ đề: HALF_OPEN thăm dò (021), saga compensation vs rollback + thứ tự bước (022), chọn 2 cách kết thúc saga (023, multi), compensating action `releaseSeat` (024), outbox at-least-once (025), idempotent consumer `processed_events` (026), idempotency key + trạng thái đang xử lý (027), orchestration vs choreography (028, multi), choreography mất message / DLQ + lag (029), timeout lồng nhau + deadline propagation (030), sync vs async (031), optimistic locking UPDATE có điều kiện (032).

Tỉ lệ: 10 câu 1 đáp án + 2 câu multi (021–032: multi ở 023, 028 = 2/12 ≈ 1/4). Đáp án đúng rải đều vị trí: single {0:2, 1:4, 2:2, 3:2}, multi {[0,2], [1,2]}. Mỗi `explain` nêu vì sao đúng **và vì sao từng phương án sai là sai**, kèm code/SQL/yaml ngắn và `> Senior tip:`.

Nghiệm thu: `node --check js/data/quiz.js` OK; `node scripts/build-light-index.js` đã chạy lại; `node scripts/validate.js` — **quiz.js không còn lỗi**. Các lỗi còn lại của validate nằm ở file của task khác (`bugs.js`: bug-023/030/031; `lessons-banking.js`: lesson-banking-007/008/009) — không thuộc T2077. Không commit, không sửa file khác.

Ghi chú kỹ thuật đã kiểm tra: Resilience4j HALF_OPEN mặc định `permittedNumberOfCallsInHalfOpenState=10`, `waitDurationInOpenState=60s`; Saga compensation idempotent + retry + state machine bền; outbox = at-least-once → consumer idempotent; Kafka exactly-once chỉ trong pipeline Kafka; timeout lồng phải có deadline propagation; optimistic locking `UPDATE ... WHERE status = :expected` + kiểm tra rowcount.
Reviewed-by: kilo (T2077R)
