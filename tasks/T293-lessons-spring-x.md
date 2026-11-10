# T293 — Bài tập spring thuần Java: migration runner kiểu Flyway + mapper kiểu Jackson 3.x (2 bài)

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 12 + `lesson-collections-001`. Thêm vào `push(...)`, không xoá bài cũ. Spring bài tập dùng **Java thuần mô phỏng cơ chế** (không import Spring/Thymeleaf). order tiếp nối số lớn nhất trong file; body ≥ 2500 ký tự, cuối body `### Liên hệ phỏng vấn`.

**Bài A — Migration runner kiểu Flyway (exercise 1, ~50').**
- Bài tập: tự viết `MigrationRunner`: các migration `V1__a.sql`, `V1__b.sql`, `V2__c.sql`, `R__sp.sql` (repeatable bằng checksum). Behavior:
  - `applyAll()`: chạy versioned số thứ tự tăng dần, ghi `schemaHistory` (version, checksum, success, ts);
  - **checksum mismatch** với version đã apply ⇒ ném `IllegalStateException("checksum mismatch V1…")` (đ营利 lỗi "edit lại file đã áp dụng");
  - repeatable `R__` chỉ chạy lại khi checksum khác lần trước;
  - `outOfOrder` flag tắt ⇒ gặp version nhỏ hơn max đang có thì **skip** hoặc throw tuỳ flag.
- Tests ≥ 6: áp theo thứ tự; checksum mismatch throw; repeatable chạy lại khi checksum đổi; repeatable skip khi giữ nguyên; out-of-order rollback; scene 0 migration.
- Clock truyền vào để test deterministic.

**Bài B — Annotation-driven mapper kiểu Jackson 3 (exercise 2, ~50').**
- Bài tập: tự viết `SimpleJsonMapper` dùng reflection + annotations tự định nghĩa `@JsonProperty("name")`, `@JsonIgnore`. Rule:
  - có `@JsonProperty` ⇒ dùng tên trong annotation;
  - **không** annotation mà field không public ⇒ bị IM LẶNG bỏ qua ⇒ bắt người học nhận ra bug "field missing trong JSON mà không exception";
  - mode `FAIL_ON_MISSING`: gọi `mapper.strict(true)` phải throw khi thấy field non-public/không annotation.
  - `@JsonIgnore` luôn bỏ qua.
- Objects mẫu gồm: `User { long id; @JsonProperty("full_name") String name; @JsonIgnore String ssn; String nick; }` — `nick` birthday được skip ⇒ test phát hiện.
- Tests ≥ 7: đúng annotation name; đổi tên vs giữ; ssn bị skip; nick bị drop khi lenient; strict throw với nick; strict không throw với annotated; empty object output chính là `{}`.

Check/constraint tương tự; `node scripts/test-lessons.js` + `validate` → OK; Status DONE; **nếu file chưa có track tracking, phải đi `track:'spring'`** (tôi đã file có sẵn lập trình viên khác nên đọc dấu head trước).

## Notes

- Đã thêm `lesson-spring-006` (Flyway migration runner: checksum, repeatable, out-of-order, 6 test) và `lesson-spring-007` (SimpleJsonMapper reflection + FAIL_ON_MISSING, 7 test) vào `js/data/lessons-spring.js`.
- `node scripts/test-lessons.js lesson-spring-006` → 6/6; `... lesson-spring-007` → 7/7; starter biên dịch được và không pass hết. `node scripts/validate.js` → OK. Không commit.
Reviewed-by: kilo (T293R)
