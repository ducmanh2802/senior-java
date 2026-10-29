# T520 — Dịch lại (nội dung đã sửa): q-devops-2 (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-devops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-devops-2.en.js` đã cũ: **devops-010, devops-011, devops-012, devops-013, devops-014, devops-015, devops-016, devops-017**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-devops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-devops-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-devops-2 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 8 mục devops-010 đến devops-017 từ tiếng Việt sang tiếng Anh. Cả hai validation đều pass: check-i18n.js báo "OK — 8 mục đã dịch" và validate.js báo "OK — không có lỗi".

## Nghiệm thu
node scripts/check-i18n.js q-devops-2 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
