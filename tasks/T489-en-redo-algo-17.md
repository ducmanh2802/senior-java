# T489 — Dịch lại (nội dung đã sửa): algo-17 (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-17.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-17.en.js` đã cũ: **algo-118, algo-119, algo-120, algo-121, algo-122, algo-123, algo-124, algo-125, algo-126, algo-127, algo-128, algo-129, algo-130**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-17.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-17 → OK; node scripts/validate.js → OK.

## Notes

- `js/i18n/algo-17.en.js` đã có bản dịch đầy đủ 13 mục (algo-118 … algo-130) từ lần chạy trước bị gián đoạn; đã đọc lại và đối chiếu từng mục với bản tiếng Việt hiện tại trong `js/data/algo.js` (sau commit rewrite 9b9bcd3) — nội dung khớp, không còn câu tiếng Việt, không cần sửa.
- Mỗi entry giữ đúng key và cùng tập field `prompt`, `hints`, `solution`, `follow`; code Java, id, số liệu, sơ đồ ASCII giữ nguyên, chỉ comment trong code block được dịch sang tiếng Anh.
- Markup giữ nguyên (`**`, `{{code}}`, `###`, bảng, `~~~lang` … `~~~`); không có backtick, không có `${`; `two\'s complement` / `Manacher\'s` đã escape đúng.
- Kiểm tra: `node scripts/check-i18n.js algo-17` → `OK — 13 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
