# T1205 — Dịch lại (nội dung đã sửa): q-security-4 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-security-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-security-4.en.js` đã cũ: **security-023, security-024**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-security-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-security-4 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `security-023` and `security-024` in `js/i18n/q-security-4.en.js` from current VI (`js/data/q-security.js` lines ~1800-1974).
- Kept keys/structure (`q`, `a`, `follow`) identical to other entries; translated Vietnamese strings in code comments/diagrams (e.g., `~~~seq` labels, Java comments) to English; no backticks/`${` in template literals.
- `node --check js/i18n/q-security-4.en.js` OK.
- `node scripts/check-i18n.js q-security-4` → `OK — 2 mục đã dịch.`
- `node scripts/validate.js` reports pre-existing errors in files I do not own (`lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js` referencing missing `api-*` question ids). No errors related to `q-security-4.en.js`/security content.
Reviewed-by: check-i18n (translation, no LLM review)
