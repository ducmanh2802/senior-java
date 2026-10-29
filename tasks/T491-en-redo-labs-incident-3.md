# T491 — Dịch lại (nội dung đã sửa): labs-incident-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-incident-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/labs-incident.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/labs-incident-3.en.js` đã cũ: **lab-incident-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/labs-incident.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/labs-incident-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js labs-incident-3 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ entry `lab-incident-005` (title, scenario, questions, hints, answer, rubric) theo bản tiếng Việt hiện tại trong `js/data/labs-incident.js`; giữ nguyên key, id và cùng tập field như các entry khác (không thêm artifacts/tags vì overlay không dịch các field đó).
- Giải thích thêm tại chỗ cho người đọc chưa quen hạ tầng: file descriptor, pod, liveness probe, leased connection, FIN/CLOSE_WAIT, route, bulkhead, try-with-resources, circuit breaker, ulimit, idempotency, singleton — mỗi thuật ngữ 1 câu kèm ví dụ ngắn; số liệu, mốc thời gian và trích dẫn artifact giữ khớp bản gốc.
- Comment trong 2 khối ~~~java đã dịch sang tiếng Anh; không có backtick hay `${` trong file; không đụng các mục 004, 006–009.
- Đã chạy: `node scripts/check-i18n.js labs-incident-3` → OK (6 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
