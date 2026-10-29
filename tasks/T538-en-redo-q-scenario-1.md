# T538 — Dịch lại (nội dung đã sửa): q-scenario-1 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-scenario.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-scenario-1.en.js` đã cũ: **scenario-011**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-scenario.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-scenario-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-scenario-1 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại scenario-011 (upload file 2GB) từ tiếng Việt sang tiếng Anh, cập nhật đầy đủ q, a, follow. Cả hai script kiểm tra đều báo OK.
Reviewed-by: check-i18n (translation, no LLM review)
