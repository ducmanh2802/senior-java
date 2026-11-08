# T1200 — Dịch lại (nội dung đã sửa): q-scenario-3 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-scenario.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-scenario-3.en.js` đã cũ: **scenario-027, scenario-029, scenario-030, scenario-031, scenario-038**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-scenario.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-scenario-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-scenario-3 → OK; node scripts/validate.js → OK.

## Notes

- Đã dịch lại 5 mục scenario-027, scenario-029, scenario-030, scenario-031, scenario-038 từ bản tiếng Việt hiện tại trong js/data/q-scenario.js sang js/i18n/q-scenario-3.en.js (giữ key, id, url, code mẫu không đổi; dịch chuỗi Việt trong code/comment sang tiếng Anh; thêm các section mới của bản Việt: luồng ~~~seq cho scenario-027, ví dụ đời thực và trả lời mẫu cho scenario-029/030/031; viết lại hoàn toàn scenario-038 theo bản Việt đã mở rộng).
- Bỏ trường `tags` khỏi 4 entry (scenario-027/029/030/031) vì scripts/check-i18n.js không nhận field `tags` trong overlay i18n (ALLOWED không có tags); scenario-038 bản Việt gốc cũng không có tags.
- node scripts/check-i18n.js q-scenario-3 → OK (17 mục đã dịch).
- node scripts/validate.js → OK cho js/data/q-scenario.js (file nguồn không bị sửa). Lỗi còn lại của validate.js toàn nằm ở các file KHÔNG sở hữu bởi task này (lessons-sql.js, lessons-api.js, projects.js, path.js…), là lỗi cũ đã có trước, không được sửa theo quy tắc AGENTS.md mục 3.
- Không commit, không build step, không dependency mới.
Reviewed-by: check-i18n (translation, no LLM review)
