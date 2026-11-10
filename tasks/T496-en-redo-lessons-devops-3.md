# T496 — Dịch lại (nội dung đã sửa): lessons-devops-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-devops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-devops-3.en.js` đã cũ: **lesson-devops-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-devops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-devops-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-devops-3 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại toàn bộ `lesson-devops-005` từ bản tiếng Việt hiện tại (bản viết lại ở commit a5db76a: Graph 429 + Retry-After, S3 prefix 3.500 PUT / 5.500 GET + 503 Slow Down, token bucket nạp lười giữ phần lẻ, pre-emptive rotation, vòng lặp ingestion có checkpoint). Giữ nguyên key và tập field (title, goals, body, exercises[title/prompt/hints/explain], check[q/options/answer/explain]); starter/tests/reference không chép sang overlay theo quy ước `scripts/check-i18n.js`.
- Code trong `body/prompt/explain` là chuỗi Java/SQL giữ nguyên; comment tiếng Việt trong snippet đã dịch sang tiếng Anh. Không có backtick, không có `${`.
- Bổ sung `answer: 1` cho 3 câu `check` (khớp thứ tự lựa chọn với bản tiếng Việt và với các file overlay khác), thêm newline cuối file.
- `node scripts/check-i18n.js lessons-devops-3` → OK; `node scripts/validate.js` → OK — không có lỗi.
