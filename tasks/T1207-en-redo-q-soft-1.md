# T1207 — Dịch lại (nội dung đã sửa): q-soft-1 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-soft.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-soft-1.en.js` đã cũ: **testing-003, testing-006, testing-008, testing-010**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-soft.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-soft-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-soft-1 → OK; node scripts/validate.js → OK.

## Notes
- 2026-11-08: Re-translated 4 entries in `js/i18n/q-soft-1.en.js` from current VN in `js/data/q-soft.js`: `testing-003`, `testing-006`, `testing-008`, `testing-010`. Kept keys/field set; translated all Vietnamese content (incl. comments in code samples) to English; preserved `{{...}}` markup, no backticks/`${` in content. Added first-use term explanations for 4-year-dev audience (test double, Mockito, Clock, CI, edge case, idempotency, N+1, flaky, DTO, JPA, etc.). Verified: `node scripts/check-i18n.js q-soft-1` → OK (10 mục đã dịch). `node scripts/validate.js` reports pre-existing errors in files NOT owned by this task (`lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`, stale `index-light.js`) — unchanged by T1207. No git commit/push performed.
Reviewed-by: check-i18n (translation, no LLM review)
