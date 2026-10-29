# T540 — Dịch lại (nội dung đã sửa): q-security-2 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-security-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-security-2.en.js` đã cũ: **security-013, security-014**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-security-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-security-2 → OK; node scripts/validate.js → OK.

## Notes
Updated English translations for security-013 (Log4Shell) and security-014 (Login brute force defense) to match the current Vietnamese content. Removed non-translatable fields (refs, tags) from English entries as per i18n schema. Both check-i18n and validate pass.
Reviewed-by: check-i18n (translation, no LLM review)
