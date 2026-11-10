# T1219 — Dịch lại (nội dung đã sửa): q-spring-data-4 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-4.en.js` đã cũ: **spring-020, spring-021**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-4 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `spring-020` (Spring Batch chunk-oriented, skip/retry, partitioning) and `spring-021` (Spring Security `@PreAuthorize`, OAuth2 resource server, CORS/CSRF) in `js/i18n/q-spring-data-4.en.js` from current Vietnamese in `js/data/q-spring-data.js`. Kept keys/fields/IDs/URLs; translated Vietnamese comments in code samples to English; preserved `{{code}}`, `~~~` blocks, no backticks/`${`.
- Verified: `node --check js/i18n/q-spring-data-4.en.js` OK; `node scripts/check-i18n.js q-spring-data-4` → `OK — 8 mục đã dịch.` (spring-020,021 present).
- `node scripts/validate.js` reports pre-existing errors/warnings unrelated to this task (lessons-api/sql `related` refs to missing `api-*` IDs, projects/path refs, path warning for lesson-design-006/007). No changes made outside owned file per AGENTS.md rule 3.
Reviewed-by: check-i18n (translation, no LLM review)
