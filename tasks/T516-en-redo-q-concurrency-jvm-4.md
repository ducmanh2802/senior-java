# T516 — Dịch lại (nội dung đã sửa): q-concurrency-jvm-4 (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-concurrency-jvm.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-concurrency-jvm-4.en.js` đã cũ: **jvm-014, jvm-015, jvm-016, jvm-017, jvm-018, concurrency-021, concurrency-022, concurrency-023**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-concurrency-jvm-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-concurrency-jvm-4 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại toàn bộ 8 entry (jvm-014..018, concurrency-021..023) từ bản tiếng Việt hiện tại, giữ nguyên key và chỉ dùng field q/a/follow như các entry khác. Code mẫu giữ nguyên, comment trong code dịch sang tiếng Anh; không backtick, không `${`, code block `~~~` giữ đủ.
- Chỉ sửa `js/i18n/q-concurrency-jvm-4.en.js`.
- Kiểm tra: `node scripts/check-i18n.js q-concurrency-jvm-4` → `OK — 8 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: check-i18n (translation, no LLM review)
