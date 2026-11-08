# T1223 — Dịch lại (nội dung đã sửa): q-spring-data-9 (12 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-9.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-9.en.js` đã cũ: **spring-028, spring-029, spring-030, spring-031, spring-032, spring-033, jpa-022, jpa-023, jpa-024, jpa-025, jpa-026, jpa-027**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-9.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.

Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-9 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated all 12 entries (spring-028..033, jpa-022..027) in `js/i18n/q-spring-data-9.en.js` to match current Vietnamese source in `js/data/q-spring-data.js`. Kept keys/field shape (q, a, follow) as existing overlay format; preserved code/IDs/tags context; translated Vietnamese strings in prose and examples to clear English for ~4y devs (terms explained on first use).
- Verified: `node --check js/i18n/q-spring-data-9.en.js` OK; `node scripts/check-i18n.js q-spring-data-9` → `OK — 12 mục đã dịch`.
- `node scripts/validate.js` reports pre-existing errors/warnings in files not owned by this task (`lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`, stale `index-light.js`); none involve `q-spring-data.js` or `q-spring-data-9.en.js`. Per task scope I did not modify those files.Reviewed-by: check-i18n (translation, no LLM review)
