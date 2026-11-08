# T1190 — Dịch lại (nội dung đã sửa): q-microservices-2 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-microservices-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-microservices.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-microservices-2.en.js` đã cũ: **microservices-011, microservices-012, microservices-013, microservices-017**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-microservices.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-microservices-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-microservices-2 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated full EN overlay entries for `microservices-011`, `microservices-012`, `microservices-013`, `microservices-017` in `js/i18n/q-microservices-2.en.js` to match current Vietnamese source (added `~~~seq` diagrams, updated sections/terminology per VI, preserved ids/keys/urls; translated Vietnamese strings in comments/code contexts where present). Kept same field set (`q`, `a`, `follow`) as other entries; did not touch other entries.
- `node --check js/i18n/q-microservices-2.en.js` OK.
- `node scripts/check-i18n.js q-microservices-2` → OK (10 items translated).
- `node scripts/validate.js` reports pre-existing warnings/errors unrelated to owned files (e.g., `lessons-sql/api`/`projects`/`path` related refs to missing `api-*` IDs, `modern-033` short answer). No errors in `js/i18n/q-microservices-2.en.js`.
Reviewed-by: check-i18n (translation, no LLM review)
