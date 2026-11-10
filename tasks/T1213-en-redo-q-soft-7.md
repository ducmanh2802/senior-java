# T1213 — Dịch lại (nội dung đã sửa): q-soft-7 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-soft.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-soft-7.en.js` đã cũ: **behavioral-029**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-soft.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-soft-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-soft-7 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `behavioral-029` in `js/i18n/q-soft-7.en.js` from the current Vietnamese source in `js/data/q-soft.js` (2-week Senior Java interview prep plan). Kept the same key/fields (`q`, `a`, `follow`); no other entries touched.
- Matched updated VI structure/content: expanded summary, added "Step by step" plan, kept JD analysis table and 14-day schedule, added minimum STAR set, company research, common mistakes, **real-world example** (5-year Java dev, 14-day plan with numbers/mocks), and **sample interview answer**. Defined terms for a ~4-year Java dev new to some tech (JD, STAR, mock interview, concurrency, transactions, system design, production incidents, Kafka, spaced-repetition/flashcards, Kubernetes, working memory) with short plain explanations.
- Markup-safe: no backticks, no `${`; used `{{}}` where needed (none required). `node --check` passed.
- Verification: `node scripts/check-i18n.js q-soft-7` → `OK — 10 mục đã dịch.` Full `node scripts/validate.js` still reports pre-existing issues outside this task's ownership (warnings: 2 PATH lessons; errors: missing `api-*` related/question refs in `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`, and stale `js/data/index-light.js`). I did not modify those files (integrator-owned/data outside scope) and did not run `build-light-index.js` for unrelated data.
Reviewed-by: check-i18n (translation, no LLM review)
