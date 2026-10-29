# T527 — Dịch lại (nội dung đã sửa): q-java-2 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-2.en.js` đã cũ: **collections-004, collections-006, collections-007, collections-009, collections-011**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-2 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 5 mục: collections-004 (Fail-fast vs fail-safe iterator), collections-006 (TreeMap/NavigableMap), collections-007 (CopyOnWriteArrayList & BlockingQueue), collections-009 (PriorityQueue), collections-011 (List.of vs unmodifiableList vs copy). Cả hai script check-i18n.js và validate.js đều báo OK.
Reviewed-by: check-i18n (translation, no LLM review)
