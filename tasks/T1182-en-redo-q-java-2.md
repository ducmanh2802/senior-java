# T1182 — Dịch lại (nội dung đã sửa): q-java-2 (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-2.en.js` đã cũ: **collections-003, collections-004, collections-005, collections-006, collections-009, collections-010, collections-011**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-2 → OK; node scripts/validate.js → OK.

## Notes
- Đã đọc bản VI hiện tại (q-java.js) cho 7 mục: collections-003,004,005,006,009,010,011 và dịch lại toàn bộ `q`/`a`/`follow` sang EN trong `js/i18n/q-java-2.en.js` (giữ nguyên key, cùng field set). Các mục khác (002,007,008,012) giữ nguyên.
- Nội dung cập nhật gồm các phần mới trong VI: "Ví dụ đời thực"/Real-world example, "Trả lời mẫu khi phỏng vấn"/Sample interview answer, "Bên trong"/Internals (modCount, min-heap top-K, ArrayDeque circular array, List.of internals). Code/markup giữ nguyên; chuỗi tiếng Việt trong comment code mẫu đã dịch (vd "Top 100 số lớn nhất" → "Top 100 largest numbers").
- Tuân thủ markup AGENTS.md §5: dùng `{{code}}`, không backtick trong content, không `${` (không có trong content). `node --check` OK.
- Kiểm tra: `node scripts/check-i18n.js q-java-2` → OK (11 mục). `node scripts/validate.js` vẫn báo các lỗi pre-existing ngoài phạm vi owned (lessons-api/projects/path tham chiếu api-* không tồn tại) — không thuộc file tôi sở hữu, không chỉnh sửa.
Reviewed-by: check-i18n (translation, no LLM review)
