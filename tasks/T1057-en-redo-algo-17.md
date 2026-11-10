# T1057 — Dịch lại (nội dung đã sửa): algo-17 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-17.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-17.en.js` đã cũ: **algo-118, algo-119, algo-120, algo-122, algo-124, algo-130**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-17.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-17 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 6 entry (algo-118, 119, 120, 122, 124, 130) trong js/i18n/algo-17.en.js từ bản tiếng Việt hiện tại. 5 entry (119, 120, 122, 124, 130) đã đồng bộ nên không thay đổi. algo-118 điều chỉnh câu mô tả quan hệ bắc cầu ("transitive") để khớp cấu trúc tiếng Việt gốc. Code, id, url giữ nguyên; comment trong code đã dịch sang tiếng Anh.
Reviewed-by: check-i18n (translation, no LLM review)
