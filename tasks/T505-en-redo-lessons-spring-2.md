# T505 — Dịch lại (nội dung đã sửa): lessons-spring-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-spring-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-spring.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-spring-2.en.js` đã cũ: **lesson-spring-007**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-spring.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-spring-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-spring-2 → OK; node scripts/validate.js → OK.

## Notes
- Working tree đã có bản dịch từ lần chạy trước bị gián đoạn (HEAD là map rỗng); đã soát lại từng đoạn của
  **lesson-spring-007** với bản VI hiện tại trong `js/data/lessons-spring.js` (summary, 6 mục `###`, bảng visibility,
  strict mode, values/empty object, pitfalls, Liên hệ phỏng vấn, Senior tip, goals, prompt/hints/explain, 3 câu `check`)
  và xác nhận khớp nghĩa, không còn chữ Việt, không backtick, không `${`.
- Giữ nguyên key `lesson-spring-007` và tập field như các entry khác: title, goals, body,
  exercises[title,prompt,hints,explain], check[q,options,answer,explain]; không chép starter/tests/reference.
- lesson-spring-006 cũng có trong file (header liệt kê 2 id, HEAD chưa dịch mục nào) nên giữ bản dịch đã có,
  đã đối chiếu lại với bản VI 006; chỉ chuẩn hoá header `ids:` và thêm newline cuối file.
- `node scripts/check-i18n.js lessons-spring-2` → OK; `node scripts/validate.js` → OK (không có lỗi).

Reviewed-by: check-i18n (translation, no LLM review)
