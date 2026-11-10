# T514 — Dịch lại (nội dung đã sửa): q-concurrency-jvm-2 (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-concurrency-jvm.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-concurrency-jvm-2.en.js` đã cũ: **concurrency-014, concurrency-015, concurrency-016, concurrency-017, concurrency-018, concurrency-019, concurrency-020, jvm-001**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-concurrency-jvm-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-concurrency-jvm-2 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại toàn bộ 8 mục (concurrency-014 … concurrency-020, jvm-001) từ bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js`, giữ nguyên key và tập field `q`/`a`/`follow` như các entry khác (không thêm tags/refs). Nội dung theo đúng cấu trúc mới của bản Việt: Summary, Understand quickly, Terms, cơ chế + bảng/sơ đồ ASCII/code, Common wrong answers / Common mistakes, One-minute spoken answer, Senior tip. Chuỗi tiếng Việt trong code và sơ đồ cũng đã dịch. Header đổi thành "task T168, re-translated in T514".
`node scripts/check-i18n.js q-concurrency-jvm-2` → OK (8 mục); `node scripts/validate.js` → OK — không có lỗi.
