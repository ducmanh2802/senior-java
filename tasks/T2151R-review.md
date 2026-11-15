# T2151R — Fact-check nội dung mới của T2151

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2151 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 4 bài học mới (lesson-microservices-014 đến 017):
| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-microservices-014 | Không có lỗi kỹ thuật. At-least-once, messageId ổn định, inbox unique constraint, TTL, dedup trong transaction — đều đúng. | Không sửa. |
| lesson-microservices-015 | Task T2151 đã sửa: thêm giải thích tiếng Việt cho "downstream service", "thread starvation", "thundering herd". Kỹ thuật đúng (3 trạng thái, failureThreshold/resetTimeoutMs/successThreshold, Half-Open probe limit, Clock injectable). | Không sửa thêm (đã được T2151 sửa). |
| lesson-microservices-016 | Không có lỗi. Rate-based breaker: sliding window count-based/time-based, minimumNumberOfCalls, failureRateThreshold. Ghi rõ khác biệt HALF_OPEN so với Resilience4j. | Không sửa. |
| lesson-microservices-017 | Không có lỗi. Registry per dependency, fallback types, metrics per dependency, isolation đúng. | Không sửa. |

Validation: `node scripts/validate.js` → OK. `node scripts/build-light-index.js` → OK. `node scripts/test-lessons.js` → 296/296 pass. Không thay đổi file dữ liệu (đã đúng).
