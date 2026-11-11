# T1228 — Dịch lại (nội dung đã sửa): quiz-10 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-10.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/quiz.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/quiz-10.en.js` đã cũ: **qz-ai-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/quiz.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/quiz-10.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js quiz-10 → OK; node scripts/validate.js → OK.

## Notes
- Đã đối chiếu `qz-ai-008` (VI `js/data/quiz.js:4996-5029`) với entry EN trong `js/i18n/quiz-10.en.js:154-181`. Bản EN hiện tại đã khớp nội dung VI hiện tại (cùng cấu trúc, options, explain, mẫu xử lý; code block giữ nguyên). Không thay đổi nội dung (không có khác biệt cần dịch lại).
- `node --check js/i18n/quiz-10.en.js` OK. `node scripts/check-i18n.js quiz-10` → "OK — 7 mục đã dịch." `node scripts/validate.js` còn lỗi pre-existing (api/lessons/projects/path refs không tồn tại) không liên quan file sở hữu.
- Không git commit/push/branch; không mở trình duyệt; không kill tiến trình.
