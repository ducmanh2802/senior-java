# T2042 — 6 câu hỏi Senior Java (jpa) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2018

Thêm **6 câu hỏi phỏng vấn mới** (topic: jpa) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Hibernate 6: second-level cache khi nào dùng và stale data, query cache pitfall, @Formula và @Subselect, DTO projection vs entity cho màn hình đọc, phân trang với JOIN FETCH bị cảnh báo HHH90003004 (in-memory pagination), soft delete với @SQLRestriction (Hibernate 6.3+).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 6 câu (topic jpa, nối tiếp jpa-057) vào `js/data/q-spring-data.js` bằng `node scripts/qtool.js append`:
- jpa-058 senior — second-level cache khi nào dùng và stale data (3 nguồn stale, invalidation, chiến lược concurrency, phát hiện/phòng ngừa, đa node).
- jpa-059 senior — query cache pitfall (lưu danh sách ID, invalidation thô theo bảng, thiếu L2, đo bằng statistics).
- jpa-060 senior — @Formula vs @Subselect (cơ chế, @Synchronize, read-only, bẫy subquery tương quan).
- jpa-061 senior — DTO projection cho màn hình đọc (read model, luôn mới vì bỏ qua cache, khi vẫn chậm/sai).
- jpa-062 senior — phân trang JOIN FETCH / HHH90003004 (to-one vs to-many, cờ fail_on_pagination_over_collection_fetch, two-query, count query).
- jpa-063 lead — soft delete @SQLRestriction 6.3+ (entity/collection/association, khác @Where, find trả null, partial unique index, test).

Nghiệm thu: `node --check` OK; `node scripts/qtool.js check` OK; `node scripts/build-light-index.js` OK (jpa 62 câu); `node scripts/validate.js` → `OK — không có lỗi.` Không commit. Chỉ sửa file được sở hữu + task file.
Reviewed-by: kilo (T2042R)
