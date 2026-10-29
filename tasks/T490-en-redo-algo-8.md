# T490 — Dịch lại (nội dung đã sửa): algo-8 (19 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-8.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-8.en.js` đã cũ: **algo-048, algo-049, algo-050, algo-051, algo-052, algo-053, algo-054, algo-055, algo-056, algo-057, algo-058, algo-059, algo-060, algo-061, algo-062, algo-063, algo-064, algo-065, algo-066**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-8.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-8 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại toàn bộ 19 entry (algo-048 … algo-066) theo bản tiếng Việt hiện tại trong `js/data/algo.js`: prompt, hints, solution, follow. Giữ nguyên key, chỉ dùng field dịch (không có starter/tests/complexity).
- Bám sát cấu trúc bản Việt: `### Approach`, các mục giải thích cơ chế ("Why…", "Another approach…"), khối chạy tay `~~~text`, `### Interview notes`, `> Senior tip:`; thêm 1 câu giải thích thuật ngữ (HashMap, heap, prefix sum, BFS, LIS…) cho người đọc chưa quen.
- Code mẫu giữ nguyên logic bản Việt (algo-048 heap có tie-break, algo-054 ArrayDeque, algo-060 ép long, algo-063 Comparator.comparing, algo-064 thử mọi c50, algo-065 lower bound, algo-066 cash/hold); chỉ dịch comment và các dòng trace tiếng Việt trong khối `~~~text`.
- Không có backtick hay `${` trong file; không còn chữ tiếng Việt ngoài code block.
- Đã chạy: `node scripts/check-i18n.js algo-8` → OK (19 mục); `node scripts/validate.js` → OK — không có lỗi.
- Chỉ sửa `js/i18n/algo-8.en.js` và file task này; không commit.
Reviewed-by: check-i18n (translation, no LLM review)
