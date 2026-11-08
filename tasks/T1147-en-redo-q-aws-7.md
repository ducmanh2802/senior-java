# T1147 — Dịch lại (nội dung đã sửa): q-aws-7 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-aws-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-aws.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-aws-7.en.js` đã cũ: **aws-046**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-aws.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-aws-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-aws-7 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `aws-046` in `js/i18n/q-aws-7.en.js` from current Vietnamese source (`js/data/q-aws.js` ~3380-3439).
- Kept same fields/shape as sibling entries in the file (`q`, `a`, `follow`); preserved key and {{...}} inline code/identifiers.
- Translated all Vietnamese text (including diagram labels and code-comment-like text in the ASCII timeline) to English; used clear beginner-friendly explanations with terms defined at first use, step-by-step rotation flow, common mistakes (symptom→why→avoidance), and 1-minute interview answer. No backticks, no `${`.
- Checks: `node --check js/i18n/q-aws-7.en.js` OK; `node scripts/check-i18n.js q-aws-7` → "OK — 6 mục đã dịch".
- `node scripts/validate.js` reports pre-existing errors unrelated to this task (lessons-sql/api related refs to missing `api-*` ids, projects/path refs) in files I do not own; I did not modify them. No errors originate from `js/i18n/q-aws-7.en.js` or `q-aws.js`.
Reviewed-by: check-i18n (translation, no LLM review)
