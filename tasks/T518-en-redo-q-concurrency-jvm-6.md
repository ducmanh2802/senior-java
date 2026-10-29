# T518 — Dịch lại (nội dung đã sửa): q-concurrency-jvm-6 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-concurrency-jvm.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-concurrency-jvm-6.en.js` đã cũ: **jvm-022, concurrency-028, concurrency-029, jvm-023, jvm-024, jvm-025**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-concurrency-jvm.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-concurrency-jvm-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-concurrency-jvm-6 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ 6 entry (jvm-022, concurrency-028, concurrency-029, jvm-023, jvm-024, jvm-025) từ bản tiếng Việt hiện tại: giữ nguyên key và tập field `q`/`a`/`follow` như các entry khác, không đụng mục nào khác, không đổi id/url.
- Bản dịch bám sát cấu trúc mới: Summary → Quick intuition → Glossary → từng bước cơ chế → bảng/so sánh → code + sơ đồ ASCII → lỗi hay gặp → trả lời miệng 1 phút → Senior tip. Comment code và nhãn trong sơ đồ ~~~text cũng dịch sang tiếng Anh; không còn ký tự tiếng Việt trong file.
- Markup hợp lệ (không backtick, không `${`), 14 code block cân cặp.
- `node scripts/check-i18n.js q-concurrency-jvm-6` → OK — 6 mục đã dịch.
- `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
