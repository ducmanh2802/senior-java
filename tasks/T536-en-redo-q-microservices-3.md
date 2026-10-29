# T536 — Dịch lại (nội dung đã sửa): q-microservices-3 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-microservices-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-microservices.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-microservices-3.en.js` đã cũ: **microservices-021, microservices-022, microservices-023, microservices-024, microservices-025, microservices-026, microservices-027, microservices-028, microservices-029**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-microservices.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-microservices-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-microservices-3 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại toàn bộ 9 entry (microservices-021…029) trong `js/i18n/q-microservices-3.en.js` theo bản tiếng Việt hiện tại của `js/data/q-microservices.js`:
- Giữ nguyên key, cùng tập field `q`/`a`/`follow`; q và follow dịch lại sát nghĩa.
- Bổ sung đầy đủ các mục mới của bản Việt: Quick intuition, Glossary, từng bước, bảng so sánh, Common mistakes, One-minute spoken answer, Senior tip.
- Dịch cả comment/chuỗi tiếng Việt trong code mẫu (Java/SQL/YAML/text) sang tiếng Anh; chỉ dùng markup `{{...}}`, không backtick, không `${`.
- Kiểm tra: `node scripts/check-i18n.js q-microservices-3` → OK (9 mục); `node scripts/validate.js` → OK; không sửa file nào khác ngoài 2 file của task.
Reviewed-by: check-i18n (translation, no LLM review)
