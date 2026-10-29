# T537 — Dịch lại (nội dung đã sửa): q-microservices-4 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-microservices-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-microservices.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-microservices-4.en.js` đã cũ: **microservices-030, microservices-031, microservices-032, microservices-033, microservices-034, microservices-035, microservices-036, microservices-037, microservices-038**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-microservices.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-microservices-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-microservices-4 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại toàn bộ `q`/`a`/`follow` của 9 mục (030–038) từ bản tiếng Việt hiện tại; không đổi key, không đụng mục khác, giữ `q` đúng nghĩa câu hỏi tiếng Việt.
- Bản dịch giữ nguyên cấu trúc mới của tiếng Việt: `**Summary:**`, `### Quick intuition`, `### Glossary`, các mục từng bước, bảng, khối `~~~text`/`~~~bash`/`~~~yaml`/`~~~java`, `### Common mistakes`, `### One-minute spoken answer`, `> Senior tip:`.
- Code/comment trong code mẫu đã dịch sang tiếng Anh; không backtick, không `${`; `\\` trong khối bash giữ đúng escape của template literal.
- `node scripts/check-i18n.js q-microservices-4` → OK — 9 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
