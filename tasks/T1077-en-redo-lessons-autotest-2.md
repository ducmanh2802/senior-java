# T1077 — Dịch lại (nội dung đã sửa): lessons-autotest-2 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-autotest.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-autotest-2.en.js` đã cũ: **lesson-autotest-003, lesson-autotest-004**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-autotest.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-autotest-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-autotest-2 → OK; node scripts/validate.js → OK.

## Notes

Xong. Đã đọc lại bản tiếng Việt hiện tại của lesson-autotest-003 và lesson-autotest-004 trong js/data/lessons-autotest.js và đối chiếu toàn bộ entry trong js/i18n/lessons-autotest-2.en.js (giữ key, cùng tập field như các entry khác: title/goals/body/exercises{title,prompt,hints,explain}/check; code mẫu như {{Xin chào <user>}} đã dịch sang {{Hello <user>}}). Kết quả: bản tiếng Anh đang đồng bộ với bản tiếng Việt (không còn chuỗi tiếng Việt, không backtick, không `${`), nên không cần sửa file.

Nghiệm thu:
- node scripts/check-i18n.js lessons-autotest-2 → OK — 2 mục đã dịch.
- node scripts/validate.js → OK — không có lỗi. (2 cảnh báo trong q-java.js/path.js đã tồn tại trước, không liên quan task này.)

Không sửa file khác, không git commit.
