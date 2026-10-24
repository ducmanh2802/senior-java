# T128 — Testing cho Senior

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`

Đã tạo `js/data/q-testing.js` với 8 câu mới (testing-017..024): 2 mid, 3 senior, 3 lead, đáp án 2350–3710 ký tự, kết thúc `> Senior tip:`, bao phủ test pyramid/trophy, slice test + context caching, Testcontainers/reuse/@ServiceConnection, contract test Pact/Spring Cloud Contract, flaky test + Awaitility + Clock, mutation testing PIT, transaction rollback + bẫy, chiến lược Kafka consumer (retry/DLP/offset). Đã cập nhật `topics.js` (topic `testing` → `q-testing.js`), `index.html` (thêm script), và `q-soft.js` (xóa testing-001..016, giữ behavioral, sửa header). `node scripts/validate.js` → OK (không lỗi, chỉ warnings từ q-english.js).

## Notes

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn trong mọi file q-*.js (không trùng). Thêm **~8 câu** topic `testing` (id tiếp nối số lớn nhất hiện có, ~2 mid / 4 senior / 2 lead, đáp án 2500–4000 ký tự, kết bằng `> Senior tip:`): test pyramid vs testing trophy thực tế, @SpringBootTest vs slice test (@WebMvcTest/@DataJpaTest) và context caching, Testcontainers (reuse, @ServiceConnection Boot 3.1+), contract test (Spring Cloud Contract/Pact), test flaky (thời gian, async, Awaitility), mutation testing PIT, test transaction rollback và bẫy, chiến lược test cho Kafka consumer. Chỉ dùng API/hành vi bạn chắc chắn đúng (Java 17/21, Spring Boot 3.x, PostgreSQL 16). Không thêm `refs` nếu không chắc link tồn tại. Chạy `node scripts/validate.js` → OK, rồi ghi `Status: DONE` + ghi chú ngắn.

## Notes
- 2026-10-24 (Claude): task ghi nhầm file q-testing.js; agent đổi topics.js và xoá testing-001..016 khỏi q-soft.js. Đã khôi phục q-soft.js/topics.js từ HEAD, ghép testing-017..024 vào cuối q-soft.js, xoá q-testing.js.
Reviewed-by: opencode (T128R)
