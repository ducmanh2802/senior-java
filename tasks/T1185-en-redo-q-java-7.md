# T1185 — Dịch lại (nội dung đã sửa): q-java-7 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-7.en.js` đã cũ: **core-027, core-028, core-029, core-030, core-031**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-7 → OK; node scripts/validate.js → OK.

## Notes

Redone English translations for core-027..core-031 in js/i18n/q-java-7.en.js. check-i18n OK (6 entries). validate has only pre-existing unrelated errors (api-* missing questions).
Reviewed-by: check-i18n (translation, no LLM review)
