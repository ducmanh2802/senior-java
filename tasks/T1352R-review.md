# T1352R — Fact-check nội dung mới của T1352

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1352 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Diff T1352 (so với HEAD) thêm 6 block `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` cho: `behavioral-030`, `testing-025`, `testing-026`, `testing-027`, `testing-028`, `testing-029`. Không có section nào khác mới.
- Kiểm tra kỹ thuật: H2 {{MODE=PostgreSQL}} vs Postgres thật (jsonb/ON CONFLICT/GIN/collation), Testcontainers singleton/pin image/reuse, Pact (pact/provider state/verification, Pact Broker, can-i-deploy, giới hạn), @Async proxy/self-invocation/void vs CompletableFuture/AsyncUncaughtExceptionHandler, SyncTaskExecutor/Awaitility, @Transactional chỉ thread test & @SpringBootTest(RANDOM_PORT) rollback, flaky phân loại (locale/timezone/port/thứ tự/CI), PIT bytecode mutant/score/no-coverage loại khỏi mẫu số/equivalent mutant — đúng với Java 17/21, Spring Boot 3.x, PostgreSQL 15.
- Lỗi đã sửa:
  - `testing-026` (Ví dụ đời thực): thay "équipe đặt hàng" (từ Pháp lẫn) bằng "team đặt hàng".
- Không phát hiện lỗi kỹ thuật/API bịa/mặc định sai/số liệu vô căn cứ/markup/backtick/`${` khác trong phần mới. Nội dung cũ ở HEAD không đụng tới.
- Kiểm tra: `node --check js/data/q-soft.js` OK. `node scripts/validate.js` không báo lỗi nào thuộc `q-soft.js`.
- Chặn do lỗi CÓ SẴN ngoài phạm vi sở hữu (không sửa được per luật 3): `q-scenario.js` lỗi cú pháp ("Unexpected identifier 'SELECT'" tại 6102) làm `node scripts/build-light-index.js` và validate toàn repo không thể đạt trạng thái `OK — không có lỗi.`; `lessons-jpa.js` cũng có lỗi cú pháp sẵn ("Unexpected token '{'"). `index-light.js` chưa rebuild được vì build-light-index.js crash bởi q-scenario.js.
