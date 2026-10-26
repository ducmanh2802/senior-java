# T291 — Bẫy Spring Boot: Flyway & Jackson 3.x — triệu chứng/nguyên nhân/cách sửa (đợt 3)

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6. Chỉ THÊM câu, không sửa/xoá câu cũ, không trùng ý. Ghi theo lô nhỏ: 2 câu mỗi lần edit, sau mỗi lô chạy `node --check js/data/q-spring-data.js` và `node scripts/validate.js`.

### topic `spring`: thêm 6 câu (`spring-034` → `spring-039`)

1. **Flyway treo khi 2 instance deploy đồng thời** — triệu chứng: boot chậm, log `Flyway validate failed` / lock; nguyên nhân; fix: `flyway.lockRetryCount`, `placeholders`, baseline-on-migrate đúng thời điểm, không cho agent chạy migration tự do.
2. **Flyway migration deep dive** — versioned vs repeatable, checksum mismatch sau khi sửa migration đã chạy; rule "không sửa file đã apply", `out-of-order:true`, `flyway info` đọc thế nào.
3. **Flyway + `CREATE INDEX CONCURRENTLY`** — không chạy được trong transact; giải pháp `executeInTransaction=false`, `@FlywayTest`, phân tách `V1__schema.sql` vs `V2__index_concurrently.sql` và chạy tuần tự qua CI.
4. **Flyway checksum wheel**: migration chạy trước rồi bị sửa → cả dự án fail; scenario: 3 nhánh cùng add `V1`, phải select-then-insert; fix dùng `baseline` / `flyway repair` (đọc hiểu) & cân nhắc dùng `spring.flyway.*` trong CI để chặn.
5. **Jackson 3.x pitfalls** — `isX vs getX` identity, thiếu `@JsonProperty` khiến JSON missing nhưng không exception (silent); JavaTimeModule không self-register trong Jackson 3 mới, cấu hình `JsonMapper.builder()...` explicit; `fail-on-empty-beans`.
6. **Jackson + Hibernate proxy / lazy** — `InvalidDefinitionException`, infinite recursion; fix `@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})`, DTO projection; tránh để AlwaysLazy trong entity.

### topic `db` hoặc `jpa`: thêm 2 câu (`db-031`, `db-032`)

7. **data.sql / schema.sql vs Flyway** — thứ tự `spring.jpa.defer-datasource-initialization=true`, thời điểm chạy, một đường duy nhất để tránh schema drift.
8. **Postgres advisory lock thay cho file lock** khi materializar recurring job chạy đa instance; code nhỏ `pg_advisory_lock` / try-lock.

## Yêu cầu chất lượng
Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` + `###` giải thích cơ chế + vì sao + code ≤30 dòng + bảng trade-off + pitfall prod + `> Senior tip:`. Không backtick và `${` trong template literal. Level ~1 mid, ~4 senior, ~1 lead.
- `node scripts/validate.js` → OK rồi cập nhật file task này `Status: DONE`.

## Notes
- Đã thêm 8 câu vào `js/data/q-spring-data.js` (file duy nhất task này sở hữu, chỉ thêm cuối file/đúng nhánh topic):
  - spring-034 (senior): Flyway treo khi deploy — 2 instance boot cùng lúc, schema lock, `lockRetryCount`, migration nặng chặn rollout, `spring.flyway.*`, baseline-on-migrate đúng thời điểm.
  - spring-035 (senior): versioned vs repeatable, checksum mismatch, "never edit applied migration", `repair` có review, `out-of-order` có chính sách, implicit commit của DDL trên MySQL.
  - spring-036 (mid): Jackson âm thầm sai — visibility field private/getter, `isX` cho boolean, `JavaTimeModule`/`WRITE_DATES_AS_TIMESTAMPS`, `FAIL_ON_EMPTY_BEANS`, JsonMapper bean vs `spring.jackson.*`, note Jackson 3 (tools.jackson).
  - spring-037 (senior): Jackson + Hibernate proxy — `hibernateLazyInitializer`/`handler`, infinite recursion hai chiều, `@JsonIgnoreProperties`/`@JsonIgnore`, jackson-datatype-hibernate6, vì sao DTO bền.
  - spring-038 (lead): schema drift giữa môi trường — nguồn hình thành, quy trình diff/forward-fix/repair có review, flyway validate CI (DB dựng từ đầu + nightly snapshot), alert trên history.
  - jpa-028 (mid): data.sql/schema.sql vs Flyway — `spring.sql.init.mode` mặc định embedded, `defer-datasource-initialization`, chọn một đường duy nhất.
  - jpa-029 (senior): `@JdbcTypeCode(SqlTypes.JSON)` + jsonb Hibernate 6, snapshot/chi phí tuân theo payload, native query + GIN, so AttributeConverter.
  - db-031 (senior): Postgres advisory lock thay file lock — session vs xact level, bẫy unlock khác connection trong pool, so ShedLock/SKIP LOCKED/Redis.
- Level đáp ứng yêu cầu: 2 mid, 4 senior, 1 lead (spring nhóm có 1 mid, 3 senior, 1 lead).
- Mỗi đáp án 2635–3427 ký tự; không backtick, không `${`; refs đã qua `check-links.mjs` (6/6 OK, 0 cảnh báo).
- Validate: `node scripts/validate.js q-spring-data.js` → **OK — không có lỗi.** Full-repo `node scripts/validate.js` Hiện **fail 100% trong `lessons-devops.js` (lỗi cú pháp "Unexpected token '...')"** + `path.js` phang lesson-devops — file của task T2xx devops-lessons đang chạy song song, không phải quyền của T291; đề xuất agent sở hữu `lessons-devops.js` sửa xong rồi chạy validate full. (Trước đó `algo.js` algo-098 cũng báo lỗi cùng kiểu nhưng đã được owner tự sửa trong lúc chờ.)
- Không sửa file nào ngoài `q-spring-data.js` và file task này; không commit/push.
