# T532 — Dịch lại (nội dung đã sửa): q-java-7 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-7.en.js` đã cũ: **core-028, core-029, core-030, core-031**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-7 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại cả 4 entry core-028, core-029, core-030, core-031 từ bản tiếng Việt hiện tại trong `js/data/q-java.js`
(core-028: thêm JDK 17/18 support của dedup, log tag mới, bullet List.copyOf; core-029: proxy là subclass ByteBuddy,
đọc id qua getter, thêm code equals/hashCode; core-030: sealed Java 17 / pattern matching Java 21, ví dụ switch
`describe()`, {{MatchException}} runtime; core-031: bullet List.copyOf trả lại instance bất biến). Giữ nguyên key,
field q/a/follow, mã code; chuỗi tiếng Việt trong code mẫu ("Từ chối: ") đã dịch sang tiếng Anh.
`node scripts/check-i18n.js q-java-7` → OK (6 mục); `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
