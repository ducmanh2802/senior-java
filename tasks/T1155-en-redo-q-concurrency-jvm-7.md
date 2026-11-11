# T1155 — Dịch lại (nội dung đã sửa): q-concurrency-jvm-7 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-concurrency-jvm.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-concurrency-jvm-7.en.js` đã cũ: **jvm-027**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-concurrency-jvm-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-concurrency-jvm-7 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `jvm-027` in `js/i18n/q-concurrency-jvm-7.en.js` from current Vietnamese source (`js/data/q-concurrency-jvm.js` lines ~4856+): full 4-phase OOM playbook (prep, emergency, evidence, analysis, prevention), kept `q`/`a`/`follow` fields consistent with other entries; no backticks or `${` in markup.
- `node scripts/check-i18n.js q-concurrency-jvm-7` → OK (2 mục đã dịch: jvm-026, jvm-027).
- `node scripts/validate.js` reports pre-existing errors in files I do not own (lessons-sql.js, lessons-api.js, projects.js, path.js referencing missing `api-*` ids) and unrelated warnings; no errors from `q-concurrency-jvm.js` or `js/i18n/q-concurrency-jvm-7.en.js`. Per AGENTS rule 3, I did not modify those files.
