# T1206 — Dịch lại (nội dung đã sửa): q-security-5 (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-security-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-security-5.en.js` đã cũ: **security-025, security-026, security-027, security-028, security-029, security-030, security-031, security-032**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-security-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-security-5 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated all 8 entries (security-025..032) in `js/i18n/q-security-5.en.js` from current VI in `js/data/q-security.js` (includes updated sections: under-the-hood/real-world/sample interview where present; kept same field set per entry). Kept keys, code/ids/URLs; translated Vietnamese strings in code comments/config examples to English. No backticks or `${` in markup; `{{...}}` inline code preserved.
- `node --check js/i18n/q-security-5.en.js` OK.
- `node scripts/check-i18n.js q-security-5` → OK (8 mục đã dịch).
- `node scripts/validate.js` → i18n/owned data OK for this change, but repo currently has **pre-existing unrelated errors** (not in files I own): `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js` reference missing `api-*` ids. I did not modify these files. Full validate will pass once those are fixed by their owners/integrator.
Reviewed-by: check-i18n (translation, no LLM review)
