# T1184 — Dịch lại (nội dung đã sửa): q-java-4 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-4.en.js` đã cũ: **core-012, core-013, core-015, core-016, core-017**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-4 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `core-012, core-013, core-015, core-016, core-017` in `js/i18n/q-java-4.en.js` from current Vietnamese in `js/data/q-java.js`; kept keys and same translatable field set as other entries (`q`, `a`, `follow`) and did not touch other entries (`modern-009, modern-010, core-018, core-019`).
- Kept code/ids/URLs; translated Vietnamese text inside code comments/strings (e.g., “a.txt/b.txt” labels remain, comment text translated). No backticks, no `${`.
- Checks: `node --check js/i18n/q-java-4.en.js` OK; `node scripts/check-i18n.js q-java-4` → `OK — 9 mục đã dịch.`
- `node scripts/validate.js` still reports pre-existing errors/warnings outside owned scope (unrelated `lessons-api/sql`, `projects.js`, `path.js` broken `api-*` related refs, stale `index-light.js`, and `q-java.js: modern-033` short answer warning). I did not modify those files (rule 3). Running `node scripts/build-light-index.js` would touch `js/data/index-light.js` (not owned); left for integrator.
Reviewed-by: check-i18n (translation, no LLM review)
