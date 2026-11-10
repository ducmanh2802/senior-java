# T1166 — Dịch lại (nội dung đã sửa): q-english-15 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-15.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-15.en.js` đã cũ: **english-129, english-130**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-15.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-15 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `english-129` and `english-130` in `js/i18n/q-english-15.en.js` to match current Vietnamese source in `js/data/q-english.js` (incl. updated phrasing, key-term explanations, and added "Full sample answer / Vocabulary and phrases to reuse / Delivery tips for Vietnamese speakers" sections).
- Preserved keys/fields, seq diagram, follow-ups structure; no backticks or `${` introduced.
- `node --check js/i18n/q-english-15.en.js` OK.
- `node scripts/check-i18n.js q-english-15` → OK (9 mục đã dịch).
- `node scripts/validate.js` shows pre-existing unrelated errors (lessons-api related refs, projects/path api-* refs); none from `q-english-15` or its i18n.
Reviewed-by: check-i18n (translation, no LLM review)
