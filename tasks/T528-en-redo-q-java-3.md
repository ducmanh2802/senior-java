# T528 — Dịch lại (nội dung đã sửa): q-java-3 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-3.en.js` đã cũ: **collections-013, modern-001, modern-003, modern-004, modern-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-3 → OK; node scripts/validate.js → OK.

## Notes

Đã đọc lại bản tiếng Việt hiện tại trong `js/data/q-java.js` và dịch lại toàn bộ 5 entry trong `js/i18n/q-java-3.en.js`: collections-013, modern-001, modern-003, modern-004, modern-008.
- Giữ nguyên key, cùng tập field `q`/`a`/`follow` như các entry khác; `follow` dịch đủ 3 câu đào sâu của bản tiếng Việt.
- Code mẫu giữ nguyên API và cấu trúc; comment tiếng Việt trong code block đã dịch sang tiếng Anh. Sửa luôn tên API gõ nhầm trong bản tiếng Việt `Comparator.composing` → `Comparator.comparing`.
- Thêm giải thích ngắn tại chỗ cho người mới ở lần xuất hiện đầu: stable, boxing, transitivity/symmetry, short-circuit, CPU-bound, DTO, dirty checking, algebraic data type, guard, collector/merge function/sentinel, combiner.
- Không đụng collections-014, modern-002, modern-005, modern-006, modern-007 và không sửa file nào khác. Không backtick, không `${`.
- Kiểm tra: `node scripts/check-i18n.js q-java-3` → OK (10 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
