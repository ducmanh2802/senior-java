# T52 — Nội dung: Testing & Behavioral (đợt 2)

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
ID tiếp nối số lớn nhất đang có trong topic (ví dụ đang có `core-011` thì bắt đầu từ `core-012`).
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `testing`: thêm 6 câu (đang có 10 → mục tiêu ≥ 16)
- Test Kafka producer/consumer: Testcontainers vs embedded, chờ bất đồng bộ (Awaitility)
- Spring test slices ({{@WebMvcTest}}, {{@DataJpaTest}}), context caching, vì sao test suite chậm và cách tăng tốc
- Test phân quyền/bảo mật: {{@WithMockUser}}, test IDOR, test JWT
- Test migration database (Flyway/Liquibase) và tương thích ngược khi deploy rolling
- Property-based testing (jqwik) và khi nào nó tìm ra bug mà example test bỏ sót
- Chaos engineering / resilience test: tiêm lỗi, timeout, mất kết nối ở môi trường staging

### topic `behavioral`: thêm 8 câu (đang có 12 → mục tiêu ≥ 20)
- Xử lý một thành viên trong team làm việc kém hoặc thiếu trách nhiệm
- Thuyết phục người khác khi bạn không có quyền quyết định (influence without authority)
- Một lần bạn trễ deadline hoặc thất bại: bạn báo tin xấu thế nào
- Bị phụ thuộc vào team khác đang chặn tiến độ: bạn làm gì
- Nhận feedback khó nghe: kể lại và bạn đã thay đổi thế nào
- Làm việc với khách hàng nước ngoài (Nhật, châu Âu, Mỹ): khác biệt văn hoá, giao tiếp, múi giờ
- Bạn phỏng vấn/tuyển người thế nào khi ở vai trò senior/lead
- Một lần bạn chủ động nhận việc vượt ngoài phạm vi (ownership) và kết quả

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
- Đã thêm **14 câu** (chỉ thêm ở cuối mảng, không sửa câu cũ):
  - `testing-011` … `testing-016` (6 câu, đúng 6 chủ đề task yêu cầu) → topic `testing` nay có **16** câu (mục tiêu ≥ 16).
  - `behavioral-013` … `behavioral-020` (8 câu, đúng 8 chủ đề task yêu cầu) → topic `behavioral` nay có **20** câu (mục tiêu ≥ 20).
- Level của 14 câu mới: `testing` = 1 mid / 4 senior / 1 lead; `behavioral` = 2 mid / 4 senior / 2 lead (tương đương 25% mid, 55% senior, 20% lead).
- Mọi đáp án mới nằm trong khoảng **3.700–4.000 ký tự**, mở đầu bằng `**Tóm tắt:**`, có các mục `###`, bảng trade-off, ví dụ code/sql, và kết bằng `> Senior tip:`. Mỗi câu có 2–3 `follow`.
- Nguyên tắc kỹ thuật đã kiểm lại: `@WithMockUser` (roles → `ROLE_`, authorities → `SCOPE_`), `@EnableMethodSecurity` (Spring Security 6), `@DataJpaTest` mặc định thay DataSource bằng DB embedded (`@AutoConfigureTestDatabase(replace = Replace.NONE)` để dùng Postgres thật), `spring.test.context.cache.maxSize` mặc định 32, `@EmbeddedKafka` + `Awaitility.untilAsserted`, `CREATE INDEX CONCURRENTLY` không chạy được trong transaction, Flyway checksum mismatch khi sửa file đã apply, expand–contract cho rolling deploy, jqwik (`@Property/@ForAll/@Provide`, `Combinators`, `Assume`), WireMock `Fault.CONNECTION_RESET_BY_PEER`/`withFixedDelay`, Resilience4j circuit breaker, Toxiproxy toxic types, APPI/GDPR/CCPA.
- Kiểm tra: `node --check js/data/q-soft.js` OK; `node scripts/validate.js` → **OK — không có lỗi** (không có cảnh báo nào cho `q-soft.js`).
- Lưu ý cho integrator: trong lúc task chạy, `js/data/labs-gc.js` (thuộc T42) đang có lỗi cú pháp làm `validate.js` toàn repo đỏ; tôi **không** sửa file đó theo luật 3. Lỗi đã được agent T42 sửa xong trong lúc tôi hoàn tất, và `validate.js` toàn repo hiện in `OK — không có lỗi.`
- Không chạy `git commit`/`git push`, không mở trình duyệt, không cài dependency.
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
