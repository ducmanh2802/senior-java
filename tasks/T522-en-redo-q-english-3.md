# T522 — Dịch lại (nội dung đã sửa): q-english-3 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-3.en.js` đã cũ: **english-031, english-032, english-033, english-034, english-035, english-036, english-037, english-038, english-039**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-3 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại toàn bộ 9 entry `english-031`…`english-039` từ bản tiếng Việt hiện tại trong `js/data/q-english.js`; giữ nguyên key, đúng tập field `q`/`a`/`follow` như các entry khác. `english-027`…`english-030` không đổi.
- Bản cũ của 032–039 là khung mẫu chung lặp lại (nhiều dấu `?` do lỗi encoding); nay thay bằng nội dung thật của từng câu: 032 impact có số liệu, 033 bottom-line-up-front, 034 sync/async + mục Phát âm, 035 mua thời gian, 036 giải thích kỹ thuật, 037 hỏi lại khi không nghe rõ, 038 công nghệ chưa dùng, 039 tự sửa sai (Kafka exactly-once).
- Tiêu đề mục dịch theo quy ước sẵn có: "### Common mistakes for Vietnamese speakers", "### Pronunciation".
- `node scripts/check-i18n.js q-english-3` → OK (13 mục); `node scripts/validate.js` → OK.
- Còn 2 file rỗng do công cụ tạo khi ghép nội dung: `.tmp-t522-mid.txt`, `.tmp-t522-splice.js` (đã làm rỗng; shell của agent bị chặn lệnh xoá nên không tự remove được — integrator xoá giúp, đừng commit).
Reviewed-by: check-i18n (translation, no LLM review)
