# T2099 — 5 câu hỏi Senior Java (testing) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T1575

Thêm **5 câu hỏi phỏng vấn mới** (topic: testing) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: testing cho Senior Java: unit vs integration vs contract test, Testcontainers với PostgreSQL/Kafka, mock đúng chỗ (không mock thứ mình không sở hữu), test flaky do thời gian/thứ tự và cách sửa, đo coverage có ý nghĩa.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 5 câu mới vào cuối `js/data/q-soft.js` (id nối tiếp lớn nhất cũ `testing-056`):

- `testing-057` (senior) — mock đúng chỗ: chỉ mock interface mình sở hữu, không mock `RestTemplate`/`KafkaTemplate`/`JdbcTemplate`; adapter + fake + `MockRestServiceServer`/WireMock; pitfall mock static, verify quá chi tiết.
- `testing-058` (senior) — Testcontainers + PostgreSQL: `ON CONFLICT`, `FOR UPDATE SKIP LOCKED`, advisory lock, `jsonb`, `timestamptz`, collation, sequence; container dùng chung, `@ServiceConnection`, cô lập dữ liệu, chạy song song.
- `testing-059` (senior) — test race condition deterministic: `CyclicBarrier` + `ExecutorService` + `awaitTermination`, `@Version`/unique constraint, vì sao `sleep`/chạy tuần tự không chứng minh được gì.
- `testing-060` (senior) — test tầng HTTP: `MockMvc` vs `TestRestTemplate` vs `WebTestClient`, assert hợp đồng tối thiểu (status, `Location`, JsonPath, lỗi validation), pitfall `@MockitoBean`/`standaloneSetup`/`FilterRegistrationBean`.
- `testing-061` (lead) — đo coverage có ý nghĩa: escaped defects, mutation score, diff coverage, flake rate, CI time, ROI khi báo cáo quản lý; kế hoạch một quý.

Kiểm tra: `node --check js/data/q-soft.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
Reviewed-by: kilo (T2099R)
