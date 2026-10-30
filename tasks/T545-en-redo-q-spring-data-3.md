# T545 — Dịch lại (nội dung đã sửa): q-spring-data-3 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-3.en.js` đã cũ: **db-001, db-002, db-003, db-004, db-005, db-006, db-007, db-008, db-009**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-3 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ db-001 … db-009 theo bản tiếng Việt hiện tại (cấu trúc dạy học mới: Summary / Quick intuition / Terms / step-by-step kèm sơ đồ ASCII / Pitfall production / Common mistakes / One-minute spoken answer / Senior tip); giữ nguyên q/a/follow, không đụng jpa-008, jpa-009.
- Cập nhật thêm các chi tiết kỹ thuật mới của bản Việt: db-003 parameter sniffing (custom plan 5 lần đầu rồi generic plan, `plan_cache_mode`; MySQL 8.0.18+ EXPLAIN ANALYZE), db-005 Spring Data 3.1+ `Window`/`ScrollPosition` và `Slice`/`List`, db-007 `spring.jpa.open-in-view=false` + cảnh báo 50 pod × pool 20 so với `max_connections=500`, db-008 PostgreSQL 11+ DEFAULT không volatile, MySQL 8.0.12+ `ALGORITHM=INSTANT` (mọi vị trí từ 8.0.29), `CHECK … NOT VALID` + `VALIDATE CONSTRAINT`, `flyway_schema_history`/`DATABASECHANGELOG`.
- Mọi chuỗi tiếng Việt trong code mẫu và sơ đồ ASCII đã dịch; không có backtick hay `${`.
- Kiểm tra: `node scripts/check-i18n.js q-spring-data-3` → OK (11 mục); `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
