# T1203 — Dịch lại (nội dung đã sửa): q-security-2 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-security-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-security-2.en.js` đã cũ: **security-010, security-011, security-012**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-security-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-security-2 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `security-010`, `security-011`, `security-012` in `js/i18n/q-security-2.en.js` to match current Vietnamese in `js/data/q-security.js` (kept keys/fields identical to other entries). Added the new `~~~seq` diagram blocks (mTLS handshake; HMAC request signing; SSRF stealing metadata credentials) with translated labels/text; translated Vietnamese strings inside code/config comments to English; preserved all code, IDs, URLs.
- Used only overlay markup (`{{}}`, `~~~`, tables, `>`); no backticks or `${` inside template literal content.
- `node scripts/check-i18n.js q-security-2` → OK (7 mục đã dịch). `node scripts/validate.js` reports pre-existing errors in unrelated files (lessons-api/sql/projects/path referencing missing `api-*` IDs) — no errors attributable to owned file. No files outside ownership modified. No git commit/push.
Reviewed-by: check-i18n (translation, no LLM review)
