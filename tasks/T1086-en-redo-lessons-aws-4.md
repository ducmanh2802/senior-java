# T1086 — Dịch lại (nội dung đã sửa): lessons-aws-4 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-aws-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-aws.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-aws-4.en.js` đã cũ: **lesson-aws-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-aws.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-aws-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-aws-4 → OK; node scripts/validate.js → OK.

## Notes

- `js/i18n/lessons-aws-4.en.js` already contained a full English translation of `lesson-aws-005` (VPC). Verified it matches the current Vietnamese source in `js/data/lessons-aws.js` (title, goals, body, exercises, check, related, tags). No code fields (starter/tests/reference) are copied — only translatable fields. No backticks, no Vietnamese characters remain.
- `node scripts/check-i18n.js lessons-aws-4` → OK (1 mục).
- `node scripts/validate.js` → OK — không có lỗi.
- No files outside `js/i18n/lessons-aws-4.en.js` were modified. No git commit/push.
