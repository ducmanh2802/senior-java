# T1138 — Dịch lại (nội dung đã sửa): q-ai-4 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-ai-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-ai.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-ai-4.en.js` đã cũ: **ai-029**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-ai.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-ai-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-ai-4 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `ai-029` in `js/i18n/q-ai-4.en.js` from the current Vietnamese source (`js/data/q-ai.js`), replacing the outdated entry.
- Kept key and translated fields consistent with file conventions (`q`, `a`, `follow`); did not include non-translated fields (`refs`/`tags`/etc.), matching `check-i18n` expectations.
- Translated Vietnamese strings in the code sample and expanded explanation for ~4-year Java devs (defined tool calling, LLM, Spring AI/ChatClient, ToolContext, tokens/context, prompt injection; added step-by-step flow + sequence diagram).
- No backticks or `${` in template literals; markup uses `{{...}}`, headings/lists/table/code/seq blocks.
- Verification: `node --check js/i18n/q-ai-4.en.js`, `node scripts/check-i18n.js q-ai-4` → OK (3 mục đã dịch), `node scripts/validate.js` → OK (no errors; existing warnings unchanged).
Reviewed-by: check-i18n (translation, no LLM review)
