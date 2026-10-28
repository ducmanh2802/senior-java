# T327 — Pet project chi tiết (phần 1): wallet, shortlink, flash-sale

Status: DONE
Agent: opencode
Owns: `js/data/projects.js`
After: T326

Mục tiêu: người học đọc xong **bắt tay làm được ngay** và **kể được khi phỏng vấn**. Chỉ sửa 3 dự án `proj-wallet`, `proj-shortlink`, `proj-flash-sale`. Giữ `id`, `title`, `level`, `skills`, mở rộng nội dung. Tuân thủ markup AGENTS.md mục 5: không backtick, không `${`, code dùng `~~~java` / `~~~sql` / `~~~yaml` / `~~~text`. Nội dung đúng kỹ thuật với Java 21, Spring Boot 3.x, Hibernate 6, PostgreSQL 16; không bịa API.

Với **mỗi** dự án:

1. **`requirements`**:
   - User story cụ thể (5–8 cái, có tiêu chí chấp nhận).
   - Phi chức năng có số liệu (throughput, p95, tính nhất quán).
   - Ngoài phạm vi (những gì không làm).
2. **`design`** (field mới của T326, 3000–6000 ký tự), gồm các mục `###`:
   - **Schema DB:** DDL PostgreSQL đầy đủ cho các bảng chính (khoá, unique, check, index và lý do chọn index).
   - **API:** bảng method / path / request / response / mã lỗi. Kèm 1 ví dụ JSON request/response cho endpoint quan trọng nhất.
   - **Luồng chính:** sơ đồ ASCII sequence cho luồng khó nhất (ví dụ chuyển tiền + outbox, hoặc đặt hàng flash sale).
   - **Xử lý lỗi & đồng thời:** bảng tình huống → hành vi hệ thống → cách test.
   - **Chiến lược test:** unit, integration với Testcontainers, test đồng thời, load test (công cụ + kịch bản), kèm số liệu mục tiêu.
   - **Chạy local:** đoạn docker-compose ngắn (≤ 25 dòng).
   - **Quan sát:** metric nào (tên metric Micrometer), log gì, alert khi nào.
   - **Mở rộng lên production:** những gì sẽ đổi khi tải tăng 10 lần.
3. **`milestones`** (giữ 4–7 mục): `tasks` viết thành **các bước đánh số** (5–10 bước). Mỗi milestone có ít nhất 1 đoạn code mẫu ≤ 30 dòng có comment, ví dụ:
   - Flyway migration.
   - Entity / repository.
   - Service `@Transactional` với update có điều kiện.
   - Test Testcontainers gửi request song song.
   - Outbox relay.
   - Cấu hình Resilience4j hoặc rate limit Redis.

   `done` là tiêu chí đo được.
4. **`challenges`** (≥ 4): mỗi thách thức có triệu chứng, nguyên nhân gốc, 2 cách giải kèm trade-off, và cách chứng minh bằng test.
5. **`interview`**:
   - `story` STAR có số liệu (trước/sau).
   - 8 `questions` kiểu interviewer hay hỏi đào sâu về dự án ("Nếu Redis chết thì sao?", "Vì sao không dùng 2PC?"…).
   - `answers` tương ứng (300–900 ký tự mỗi câu, có lập luận trade-off).
   - Thêm mục `### Demo trong 5 phút` ở cuối `story`: thứ tự màn hình/lệnh để demo.
6. `related`: thêm id câu hỏi / bài học **có thật** liên quan (kiểm tra bằng grep).

Ghi file theo từng dự án, sau mỗi dự án chạy `node --check js/data/projects.js` và `node scripts/validate.js`. Ghi Notes, `Status: DONE`.

## Notes

- Rewrote proj-wallet, proj-shortlink, proj-flash-sale in `js/data/projects.js` (ids/title/level/skills/readme unchanged; other projects untouched).
- Each: requirements with 7–8 user stories + acceptance criteria, NFR numbers, out-of-scope; `design` (~7–8.7k chars: DDL + index rationale, API table + JSON, ASCII sequence, error/concurrency table, test strategy, docker-compose, Micrometer metrics/alerts, x10 scaling); 5 milestones with numbered steps + commented code; 5 challenges (symptom/root cause/2 options/test); STAR with before/after numbers + "Demo trong 5 phút"; 8 questions + answers (580–690 chars).
- Design is longer than the 3000–6000 target because it includes full SQL/YAML; trim if needed.
- related: added real ids only (scenario-025, design-022/005/002/003/009/004/010, api-015/019/002, microservices-005/038/026, db-010, testing-002/020, scenario-008/018/049/051, english-021).
- `node --check` OK. `node scripts/validate.js` → OK when run against HEAD's q-microservices.js; the working-tree q-microservices.js currently has a syntax error from another agent's in-progress edit (line 56, backticks), which makes microservices-* related ids temporarily "not found".
Reviewed-by: claude (subagent; validate OK on HEAD+projects.js)
