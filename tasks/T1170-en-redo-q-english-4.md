# T1170 — Dịch lại (nội dung đã sửa): q-english-4 (17 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-4.en.js` đã cũ: **english-040, english-041, english-042, english-043, english-044, english-045, english-046, english-047, english-048, english-049, english-050, english-051, english-052, english-053, english-054, english-055, english-057**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-4 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated all 17 required entries in `js/i18n/q-english-4.en.js` from current VI source: english-040–055 and english-057 (056 kept consistent with current source). Kept keys and same field set as existing entries (`q`, `a`, `follow`).
- Preserved code/ids/inline code tokens (`{{@Transactional}}`, `{{max.poll.interval.ms}}`); no backticks or `${` introduced. Vietnamese text in examples translated to English where present in source text.
- Checks: `node --check js/i18n/q-english-4.en.js` OK; `node scripts/check-i18n.js q-english-4` → “OK — 18 mục đã dịch.”
- `node scripts/validate.js` still reports pre-existing unrelated errors/warnings outside this file (lessons-sql/api related IDs, projects/path related/question refs, q-java/modern-033 warning, path warnings). No files outside owned scope modified.
Reviewed-by: check-i18n (translation, no LLM review)
