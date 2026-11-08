# T1083 — Dịch lại (nội dung đã sửa): lessons-autotest-8 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-8.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-autotest.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-autotest-8.en.js` đã cũ: **lesson-autotest-010**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-autotest.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-autotest-8.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-autotest-8 → OK; node scripts/validate.js → OK.

## Notes
- 2026-11-08: Re-translated `lesson-autotest-010` ("Parallel execution and sharding in CI: JUnit 5 parallel, the Playwright Docker image, splitting shards by duration") in `js/i18n/lessons-autotest-8.en.js` from current VI `js/data/lessons-autotest.js`.
- Preserved key `lesson-autotest-010` and full field set (title, goals, body, exercises[title/prompt/hints/explain], check[4 items with q/options/explain]). No other entries touched.
- Kept code/ids/technical tokens; followed markup rules (no backticks, no `${` — GH Actions `${{` escaped as `\\\${{` inside template literals, consistent with renderer).
- `node --check js/i18n/lessons-autotest-8.en.js` OK. `node scripts/check-i18n.js lessons-autotest-8` → `OK — 1 mục đã dịch.` `node scripts/build-light-index.js` ran (no lesson data change). `node scripts/validate.js` → `OK — không có lỗi.` No git commands run.
Reviewed-by: check-i18n (translation, no LLM review)
